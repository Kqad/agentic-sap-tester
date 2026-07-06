// SAPTest Web Console — Express + WebSocket server.
//
// Subsystems:
//   * Auth (cookie-based JWT, bcrypt-hashed users.json) — see auth/.
//   * REST API for cases / config / results / users / audit / agent.
//   * Live-streaming run logs over /ws/run.
//   * Static SPA in web/ + Midscene HTML reports under /reports/.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

import { ROOT, CASES_DIR, REPORT_DIR, RESULTS_DIR, RUNS_DIR } from './paths.js';
import { bootstrapAdminIfNeeded } from './auth/users.js';
import { stripBrandingForReports, watchAndStripReports } from './lib/strip-branding.js';
import authRouter from './auth/routes.js';
import casesRouter from './api/cases.js';
import configRouter from './api/config.js';
import resultsRouter from './api/results.js';
import generateRouter from './api/generate.js';
import searchRouter from './api/search.js';
import agentRouter from './api/agent.js';
import caseAgentRouter from './api/case-agent.js';
import caseAgentVideoRouter from './api/case-agent-video.js';
import usersRouter from './api/users.js';
import auditRouter from './api/audit.js';
import { mountRunRouter, registerRunWebsocket } from './api/run.js';
import midsceneJsRouter from './api/midscene-js.js';
import translateRouter from './api/translate.js';
import validatedRouter from './api/validated.js';
import chatRouter from './api/chat.js';
import { configureLlmProxy, getLlmProxyUrl } from './midscene/llm-proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const WEB_DIR    = path.join(ROOT, 'web');

// Register undici's global ProxyAgent BEFORE any route handler runs. Bosch
// corp network blocks direct calls to DashScope; LLM_PROXY_URL points at
// the local Squid (127.0.0.1:3128). Other LLM call-sites (runner.js,
// llm.js, translation.js) call this lazily — but /api/generate and
// /api/chat used plain fetch() and would fail with "model request failed"
// until this ran. Doing it once at boot covers every route.
configureLlmProxy();
const _proxyUrl = getLlmProxyUrl();
if (_proxyUrl) console.log(`[boot] LLM fetch routed through proxy: ${_proxyUrl}`);
else console.log('[boot] No LLM_PROXY_URL set — fetch goes direct');

const app = express();
app.set('trust proxy', true);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Auth routes are unauthenticated (login/logout/me). Everything else under
// /api enforces auth via per-router middleware.
app.use('/api/auth', authRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    node: process.version,
    pid: process.pid,
    time: new Date().toISOString(),
  });
});

app.use('/api/cases',    casesRouter);
app.use('/api/config',   configRouter);
app.use('/api/results',  resultsRouter);
app.use('/api/generate', generateRouter);
// Semantic project search — used by My Projects filter bar. Hits the
// same DashScope model as /api/chat but with a JSON-only system prompt
// tailored for "which project ids does this query match" so the client
// can merge with its instant local pinyin matches.
app.use('/api/search',   searchRouter);
// AI Workbench planner — turns natural-language requests into a JSON
// sequence of tool calls (createProjects / runLatestProjects / navigate)
// that the Run Center frontend executes locally. Same DashScope model as
// /api/chat and /api/search, different KB (automation-kb.md) and a
// stricter "JSON only" system prompt.
app.use('/api/agent',    agentRouter);
// Case Studio debug agent — analyses a failing case (error snippet +
// step context) and proposes ONE minimal fix (setStepLocator /
// insertSleepAfter / changeStepApi). Stage 1 is human-in-the-loop:
// /analyze returns the proposal, /apply mutates the case JSON on disk.
app.use('/api/case-agent', caseAgentRouter);
// Video → Case pipeline. Mounted on a distinct path so its raw() body
// parser (video bytes) doesn't clash with the JSON parser used by the
// rest of /api/case-agent/*.
app.use('/api/case-agent/video-to-case', caseAgentVideoRouter);
app.use('/api/users',    usersRouter);
app.use('/api/audit',    auditRouter);
mountRunRouter(app);
app.use('/api/midscene-js', midsceneJsRouter);
// Validated-cases registry — which case ids the user-facing Run Center
// surfaces. Promote/demote happens from dev UIs; user UI loads list on
// demand via the global Refresh button.
app.use('/api/validated', validatedRouter);
// In-app AI chat helper — used by the Case Studio chat widget. Same
// upstream model as /api/generate, different system prompt tuned for
// "I'm stuck on screen X" pain-point responses.
app.use('/api/chat', chatRouter);
// Translation API for the Midscene report frame — unauthenticated so the
// iframe content (which loads at /reports/*) can fetch it without cookies.
app.use('/api/translate', translateRouter);

// Midscene HTML reports. NOTE: anyone with a valid session can read these
// via the SPA; we don't gate /reports here to keep iframe embedding simple,
// but report filenames are unguessable UUID-suffixed. If you publish this
// system externally, change the iframe approach to a signed-token download.
//
// We intercept .html requests first to inject a back-bar at the top of the
// page — Midscene's generated report has no in-page navigation, so without
// this the user is stuck with no way back to the Test Run Center other
// than closing the tab. The injection is a 44px fixed bar with a "← 返回"
// button that calls window.close() (works for the window.open(_, _blank)
// path used by Run Center) with a window.history.back() fallback for
// direct navigations / bookmarks.
const REPORT_BACK_BAR = `<div id="__sap_back_bar" style="position:fixed;top:0;left:0;right:0;height:44px;background:#15304f;color:#fff;display:flex;align-items:center;padding:0 16px;z-index:2147483647;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
  <button id="__sap_back_btn" style="background:#fff;color:#15304f;border:0;padding:6px 14px;border-radius:6px;font-weight:800;cursor:pointer;font-size:13px;">← 返回</button>
  <span style="margin-left:14px;opacity:0.85;font-weight:600;letter-spacing:0.02em;">SAP Test · Midscene Report</span>
  <span style="margin-left:auto;opacity:0.6;font-size:11px;">按 Esc 也可关闭</span>
</div>
<style>html,body{padding-top:44px !important;}</style>
<script>
(function(){
  function back(){ try { if (window.opener) { window.close(); return; } } catch(e){}
                  if (history.length > 1) history.back(); else window.close(); }
  document.getElementById('__sap_back_btn').addEventListener('click', back);
  document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape') back(); });
})();
</script>`;

app.get(/^\/reports\/.+\.html$/i, async (req, res, next) => {
  // Resolve under REPORT_DIR and guard against path-traversal.
  const rel = req.path.slice('/reports/'.length);
  const filePath = path.resolve(REPORT_DIR, rel);
  if (!filePath.startsWith(path.resolve(REPORT_DIR))) return res.status(403).end();
  try {
    const html = await fs.readFile(filePath, 'utf8');
    // Inject right after <body> open. If for some reason there's no
    // <body> tag, prepend instead — still produces a usable bar.
    const injected = /<body[^>]*>/i.test(html)
      ? html.replace(/<body([^>]*)>/i, `<body$1>${REPORT_BACK_BAR}`)
      : REPORT_BACK_BAR + html;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(injected);
  } catch {
    next();
  }
});

app.use('/reports', express.static(REPORT_DIR, {
  setHeaders: (res) => { res.setHeader('X-Content-Type-Options', 'nosniff'); },
}));

// Static SPA. Use no-cache (= browser must revalidate every request, but
// can keep the cached bytes if the server returns 304). This stops the
// console from going stale after we ship UI changes — without it the
// browser will happily serve a months-old app.js from disk forever.
app.use(express.static(WEB_DIR, {
  extensions: ['html'],
  setHeaders: (res) => { res.setHeader('Cache-Control', 'no-cache'); },
}));

// SPA fallback (don't swallow /api or /reports)
app.get(/^(?!\/api|\/reports).*/, (_req, res) => {
  const idx = path.join(WEB_DIR, 'index.html');
  if (existsSync(idx)) return res.sendFile(idx);
  res.status(404).send('Web UI not built.');
});

// Generic error sink so we never leak stack traces.
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[api error]', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'internal error' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/run' });
registerRunWebsocket(wss);

const PORT = Number(process.env.PORT || 5174);
const HOST = process.env.HOST || '127.0.0.1';

(async () => {
  for (const dir of [CASES_DIR, REPORT_DIR, RESULTS_DIR, RUNS_DIR, path.join(ROOT, 'server', 'data')]) {
    await fs.mkdir(dir, { recursive: true }).catch(() => {});
  }
  const bootstrap = await bootstrapAdminIfNeeded();

  // Strip Midscene branding from any HTML reports already on disk (catches
  // reports produced while the server was down), then keep watching the dir
  // so CLI-driven runs (`npm test`) get sanitized too. Both are best-effort.
  stripBrandingForReports(REPORT_DIR, 0).then(r => {
    if (r.processed > 0) console.log(`  → Stripped Midscene branding from ${r.processed} existing report(s)`);
  }).catch(() => {});
  watchAndStripReports(REPORT_DIR);

  server.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}`;
    console.log('');
    console.log('  SAPTest Web Console ready');
    console.log(`  → URL:    ${url}`);
    console.log(`  → Health: ${url}/api/health`);
    console.log(`  → Run WS: ws://${HOST}:${PORT}/ws/run`);
    if (bootstrap) {
      console.log('');
      console.log('  ┌─────────────── FIRST-RUN ADMIN ───────────────┐');
      console.log(`  │  username: ${bootstrap.user.username.padEnd(34)} │`);
      console.log(`  │  password: ${bootstrap.password.padEnd(34)} │`);
      if (bootstrap.generated) {
        console.log('  │  (auto-generated — change it after first login) │');
      } else {
        console.log('  │  (from ADMIN_PASSWORD env var)                  │');
      }
      console.log('  └────────────────────────────────────────────────┘');
    }
    console.log('');
  });
})();
