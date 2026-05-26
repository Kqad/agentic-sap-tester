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
import usersRouter from './api/users.js';
import auditRouter from './api/audit.js';
import { mountRunRouter, registerRunWebsocket } from './api/run.js';
import midsceneJsRouter from './api/midscene-js.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const WEB_DIR    = path.join(ROOT, 'web');

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
app.use('/api/users',    usersRouter);
app.use('/api/audit',    auditRouter);
mountRunRouter(app);
app.use('/api/midscene-js', midsceneJsRouter);

// Midscene HTML reports. NOTE: anyone with a valid session can read these
// via the SPA; we don't gate /reports here to keep iframe embedding simple,
// but report filenames are unguessable UUID-suffixed. If you publish this
// system externally, change the iframe approach to a signed-token download.
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
