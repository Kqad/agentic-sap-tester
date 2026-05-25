// /api/run + ws://.../ws/run — spawn `npm test` for a specific spec and
// stream stdout/stderr lines to all connected WebSocket clients. Only one
// run at a time. Authorized via requirePermission('runs:execute').

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import crypto from 'node:crypto';
import express from 'express';
import { ROOT, E2E_DIR, REPORT_DIR, RUNS_DIR } from '../paths.js';
import { requireAuth, requirePermission, tryAuth } from '../auth/middleware.js';
import { hasPermission } from '../auth/rbac.js';
import { audit } from '../audit.js';
import { stripBrandingForReports } from '../lib/strip-branding.js';

// Derive a stable caseId from a spec path so historical runs can be grouped
// per case. e2e/asset-balance.spec.ts → asset-balance.
function caseIdFromSpec(specRel) {
  if (!specRel) return null;
  const m = String(specRel).match(/(?:^|\/)([a-zA-Z0-9_\-]+)\.spec\.ts$/);
  return m ? m[1] : null;
}

function newRunId(spec) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '');
  const slug = caseIdFromSpec(spec) || 'run';
  const rand = crypto.randomBytes(3).toString('hex');
  return `${ts}-${slug}-${rand}`;
}

const VALID_CACHE_STRATEGIES = new Set(['read-only', 'read-write', 'write-only']);
const MIDSCENE_CACHE_DIR = path.join(ROOT, 'midscene_run', 'cache');

// Module-singleton run state.
const state = {
  running: false,
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  spec: null,
  caseId: null,
  runId: null,
  headed: false,
  useCache: false,
  cacheStrategy: null,
  pid: null,
  logs: [],          // ring buffer of stdout/stderr lines (user-visible console)
  events: [],        // structured step events from the custom reporter (used by the live preview)
  child: null,
  startedByUserId: null,
  startedByUsername: null,
};
const LOG_BUFFER_MAX = 2000;
const EVENT_BUFFER_MAX = 2000;
const EVENT_PREFIX = '##SAPEVT## ';

// Resolve npm so we don't depend on the parent process's PATH. The server may
// be started from contexts where C:\Program Files\nodejs isn't on PATH (e.g.
// PowerShell Start-Process from a shell that hasn't picked up the install),
// in which case `npm.cmd` would fail with "is not recognized". npm ships next
// to the node executable, so resolve it via process.execPath.
function resolveNpm() {
  const isWin = process.platform === 'win32';
  const npmName = isWin ? 'npm.cmd' : 'npm';
  const nodeDir = path.dirname(process.execPath);
  const candidate = path.join(nodeDir, npmName);
  if (existsSync(candidate)) return { cmd: candidate, nodeDir };
  return { cmd: npmName, nodeDir };
}

// Ensure nodeDir is on the child's PATH so any sub-spawn (npm wrappers,
// playwright launching browsers, etc.) can find node.exe.
function withNodeOnPath(env, nodeDir) {
  if (!nodeDir) return env;
  const next = { ...env };
  const pathKey = Object.keys(next).find(k => k.toUpperCase() === 'PATH') || (process.platform === 'win32' ? 'Path' : 'PATH');
  const current = String(next[pathKey] || '');
  const parts = current.split(path.delimiter).map(p => p.toLowerCase());
  if (!parts.includes(nodeDir.toLowerCase())) {
    next[pathKey] = current ? `${nodeDir}${path.delimiter}${current}` : nodeDir;
  }
  return next;
}

const wsClients = new Set();

function broadcast(msg) {
  const payload = JSON.stringify(msg);
  for (const ws of wsClients) {
    if (ws.readyState === 1) {
      try { ws.send(payload); } catch { /* ignore */ }
    }
  }
}

function pushEvent(evt) {
  state.events.push(evt);
  if (state.events.length > EVENT_BUFFER_MAX) {
    state.events.splice(0, state.events.length - EVENT_BUFFER_MAX);
  }
  broadcast({ type: 'event', event: evt });
}

function pushLog(stream, line) {
  // Intercept structured events emitted by server/run/reporter.cjs. They
  // travel through the same stdout pipe but should not appear in the raw
  // console log; instead they drive the live step preview.
  if (stream === 'stdout' && line.startsWith(EVENT_PREFIX)) {
    const json = line.slice(EVENT_PREFIX.length);
    try {
      const evt = JSON.parse(json);
      pushEvent(evt);
      return;
    } catch {
      // Malformed event line — fall through and surface it as a normal log.
    }
  }
  const entry = { ts: Date.now(), stream, line };
  state.logs.push(entry);
  if (state.logs.length > LOG_BUFFER_MAX) {
    state.logs.splice(0, state.logs.length - LOG_BUFFER_MAX);
  }
  broadcast({ type: 'log', ...entry });
}

function publicStatus() {
  return {
    running: state.running,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    exitCode: state.exitCode,
    spec: state.spec,
    caseId: state.caseId,
    runId: state.runId,
    headed: state.headed,
    useCache: state.useCache,
    cacheStrategy: state.cacheStrategy,
    pid: state.pid,
    startedBy: state.startedByUsername,
    logLines: state.logs.length,
  };
}

async function persistRunRecord(report) {
  if (!state.runId || !state.caseId) return;
  const record = {
    runId: state.runId,
    caseId: state.caseId,
    spec: state.spec,
    headed: state.headed,
    useCache: state.useCache,
    cacheStrategy: state.cacheStrategy,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    durationMs: state.startedAtMs ? Date.now() - state.startedAtMs : null,
    exitCode: state.exitCode,
    status: state.exitCode === 0 ? 'passed' : 'failed',
    startedBy: state.startedByUsername,
    report: report || null,
    events: state.events.slice(),
    // Keep a compact tail of the log for offline triage; the full log lives in
    // memory only and is dropped when a new run starts.
    logTail: state.logs.slice(-200),
  };
  try {
    await fs.mkdir(RUNS_DIR, { recursive: true });
    const file = path.join(RUNS_DIR, `${state.runId}.json`);
    await fs.writeFile(file, JSON.stringify(record, null, 2), 'utf8');
  } catch (err) {
    // Persisting history is best-effort — never block the run finalization on it.
    // eslint-disable-next-line no-console
    console.error('[run] failed to persist run record', err);
  }
}

async function findLatestMergedReport(after) {
  try {
    const entries = await fs.readdir(REPORT_DIR);
    const merged = entries
      .filter(n => n.startsWith('playwright-merged-') && n.endsWith('.html'))
      .map(n => ({ name: n, full: path.join(REPORT_DIR, n) }));
    const stats = await Promise.all(merged.map(async m => ({ ...m, mtime: (await fs.stat(m.full)).mtimeMs })));
    stats.sort((a, b) => b.mtime - a.mtime);
    const top = stats[0];
    if (!top) return null;
    if (after && top.mtime < after) return null;
    return { name: top.name, url: `/reports/${encodeURIComponent(top.name)}` };
  } catch { return null; }
}

export function mountRunRouter(app) {
  const router = express.Router();
  router.use(requireAuth());

  router.get('/status', requirePermission('results:read'), (_req, res) => {
    res.json(publicStatus());
  });

  router.get('/logs', requirePermission('results:read'), (_req, res) => {
    res.json({ logs: state.logs, events: state.events, status: publicStatus() });
  });

  router.post('/start', requirePermission('runs:execute'), async (req, res) => {
    if (state.running) {
      return res.status(409).json({ error: 'a run is already in progress', status: publicStatus() });
    }
    const specRel = req.body?.spec;
    if (!specRel || typeof specRel !== 'string') {
      return res.status(400).json({ error: 'spec is required, e.g. "e2e/asset-balance-check.spec.ts"' });
    }
    // Restrict to files inside e2e/ matching *.spec.ts
    const norm = specRel.replace(/\\/g, '/');
    if (!/^e2e\/[a-zA-Z0-9_\-]+\.spec\.ts$/.test(norm)) {
      return res.status(400).json({ error: 'spec must be e2e/<name>.spec.ts' });
    }
    const absSpec = path.join(ROOT, norm);
    const exists = await fs.access(absSpec).then(() => true).catch(() => false);
    if (!exists) return res.status(404).json({ error: 'spec not found' });

    const headed = !!req.body?.headed;
    const useCache = !!req.body?.useCache;
    let cacheStrategy = req.body?.cacheStrategy ?? null;
    if (cacheStrategy !== null && !VALID_CACHE_STRATEGIES.has(cacheStrategy)) {
      return res.status(400).json({
        error: `cacheStrategy must be one of: ${[...VALID_CACHE_STRATEGIES].join(', ')}`,
      });
    }

    // On Windows, npm ships as npm.cmd. Node 20+ refuses to spawn .cmd/.bat
    // without shell: true (CVE-2024-27980), so we enable shell there. The
    // spec value is already validated by the regex above, so no injection.
    const isWin = process.platform === 'win32';
    const { cmd: npmCmd, nodeDir } = resolveNpm();
    const scriptName = headed ? 'test:headed' : 'test';

    // When shell:true on Windows, the command is joined into a cmd.exe /c
    // line. Wrap absolute paths containing spaces (e.g. "C:\Program Files\
    // nodejs\npm.cmd") in quotes so cmd.exe parses it as a single token.
    const npmArg = isWin && /\s/.test(npmCmd) ? `"${npmCmd}"` : npmCmd;

    // Build the child env, layering Midscene cache vars on top when the user
    // opted in. The fixture (e2e/fixture.ts) reads MIDSCENE_CACHE and
    // MIDSCENE_CACHE_STRATEGY at spawn time. We always pass an explicit value
    // so a previously set MIDSCENE_CACHE=1 in the server env doesn't leak
    // into runs the user explicitly toggled off.
    const childEnv = withNodeOnPath(process.env, nodeDir);
    childEnv.MIDSCENE_CACHE = useCache ? '1' : '';
    if (useCache && cacheStrategy) {
      childEnv.MIDSCENE_CACHE_STRATEGY = cacheStrategy;
    } else {
      delete childEnv.MIDSCENE_CACHE_STRATEGY;
    }

    // Spawn FIRST, then flip state. If we flip state before spawning and
    // spawn throws synchronously (the EINVAL case on Windows for .cmd
    // without shell:true), running stays stuck at true with no child to kill.
    let child;
    try {
      child = spawn(npmArg, ['run', scriptName, '--', norm], {
        cwd: ROOT,
        env: childEnv,
        shell: isWin,
        windowsHide: true,
      });
    } catch (err) {
      return res.status(500).json({ error: `failed to spawn npm: ${err.message}` });
    }

    // Spawn returned a child; commit state.
    state.running = true;
    state.startedAt = new Date().toISOString();
    state.startedAtMs = Date.now();
    state.finishedAt = null;
    state.exitCode = null;
    state.spec = norm;
    state.caseId = caseIdFromSpec(norm);
    state.runId = newRunId(norm);
    state.headed = headed;
    state.useCache = useCache;
    state.cacheStrategy = useCache ? (cacheStrategy || 'read-write') : null;
    state.logs = [];
    state.events = [];
    state.startedByUserId = req.user.id;
    state.startedByUsername = req.user.username;
    state.child = child;
    state.pid = child.pid;
    broadcast({ type: 'status', status: publicStatus() });
    pushLog('info', `> ${path.basename(npmCmd)} run ${scriptName} -- ${norm}`);
    if (useCache) {
      pushLog('info', `[cache] Midscene cache replay enabled (strategy: ${state.cacheStrategy})`);
    }

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    const bindLines = (stream, name) => {
      let buf = '';
      stream.on('data', chunk => {
        buf += chunk;
        let idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).replace(/\r$/, '');
          buf = buf.slice(idx + 1);
          pushLog(name, line);
        }
      });
      stream.on('end', () => { if (buf) pushLog(name, buf); });
    };
    bindLines(child.stdout, 'stdout');
    bindLines(child.stderr, 'stderr');

    child.on('error', (err) => {
      pushLog('stderr', `[spawn error] ${err.message}`);
      // Some spawn failures surface as an 'error' event without a matching
      // 'close', leaving running:true forever. Force-clear here too; if
      // 'close' also fires later it'll be a harmless second clear.
      if (state.running) {
        state.running = false;
        state.finishedAt = new Date().toISOString();
        state.exitCode = -1;
        state.child = null;
        state.pid = null;
        broadcast({ type: 'status', status: publicStatus() });
      }
    });
    child.on('close', async (code) => {
      state.running = false;
      state.finishedAt = new Date().toISOString();
      state.exitCode = code;
      state.child = null;
      state.pid = null;
      pushLog('info', `--- process exited with code ${code} ---`);
      // Sanitize the freshly produced reports before we hand a URL to the
      // client — strips Midscene title/logo/branding from any HTML touched
      // by this run. Best-effort; failures are logged inside the helper.
      try { await stripBrandingForReports(REPORT_DIR, state.startedAtMs - 5000); } catch { /* best-effort */ }
      const report = await findLatestMergedReport(state.startedAtMs - 1000);
      await persistRunRecord(report);
      await audit({ user: { id: state.startedByUserId, username: state.startedByUsername, role: 'unknown' } },
        'runs.finished', { spec: state.spec, runId: state.runId, exitCode: code, report: report?.name });
      broadcast({ type: 'status', status: publicStatus(), report, runId: state.runId });
    });

    await audit(req, 'runs.started', { spec: norm, headed, useCache, cacheStrategy: state.cacheStrategy });
    res.json({ ok: true, status: publicStatus() });
  });

  router.post('/stop', requirePermission('runs:stop'), async (req, res) => {
    if (!state.running) {
      return res.status(409).json({ error: 'no run in progress' });
    }
    // Orphaned state: running flag is set but the child handle is gone
    // (e.g. spawn never produced a kill-able process, or 'close' was missed).
    // Reset state instead of leaving the UI locked out.
    if (!state.child) {
      state.running = false;
      state.finishedAt = new Date().toISOString();
      state.exitCode = -1;
      state.pid = null;
      pushLog('info', '--- run state reset (no live child) ---');
      broadcast({ type: 'status', status: publicStatus() });
      await audit(req, 'runs.stopped', { spec: state.spec, reason: 'orphaned-state-reset' });
      return res.json({ ok: true, reset: true });
    }
    try {
      if (process.platform === 'win32') {
        // tree-kill the npm wrapper + child
        spawn('taskkill', ['/pid', String(state.child.pid), '/T', '/F']);
      } else {
        state.child.kill('SIGTERM');
      }
      await audit(req, 'runs.stopped', { spec: state.spec });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Midscene cache replay support.
  //
  // Cache files are .cache.yaml records that Midscene writes after a
  // successful AI plan / locate call. They live under midscene_run/cache/
  // and are keyed by "<spec>(<test title>)". On a subsequent run with
  // cache enabled, Midscene replays the cached xpath/plan and skips the
  // model call — much faster and deterministic, but bound to the page
  // structure at the time of recording.
  router.get('/cache', requirePermission('results:read'), async (_req, res) => {
    try {
      const entries = await fs.readdir(MIDSCENE_CACHE_DIR).catch(() => []);
      const files = entries.filter(n => n.endsWith('.cache.yaml'));
      const stats = await Promise.all(files.map(async (n) => {
        const full = path.join(MIDSCENE_CACHE_DIR, n);
        const st = await fs.stat(full).catch(() => null);
        return st ? {
          name: n,
          // The cacheId is the file name minus .cache.yaml; the segment
          // before "(" is the spec stem, which lets the UI group entries.
          spec: n.replace(/\.cache\.yaml$/, '').split('(')[0],
          size: st.size,
          mtime: st.mtimeMs,
        } : null;
      }));
      res.json({ caches: stats.filter(Boolean).sort((a, b) => b.mtime - a.mtime) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/cache', requirePermission('runs:execute'), async (req, res) => {
    if (state.running) {
      return res.status(409).json({ error: 'cannot modify cache while a run is in progress' });
    }
    const name = req.query?.name;
    try {
      // No name → clear the whole cache dir. Constrain to .cache.yaml so we
      // never blow away anything Midscene's tooling drops alongside.
      if (!name) {
        const entries = await fs.readdir(MIDSCENE_CACHE_DIR).catch(() => []);
        const files = entries.filter(n => n.endsWith('.cache.yaml'));
        await Promise.all(files.map(n => fs.unlink(path.join(MIDSCENE_CACHE_DIR, n)).catch(() => {})));
        await audit(req, 'cache.cleared', { count: files.length });
        return res.json({ ok: true, removed: files.length });
      }
      // Single-file delete — validate it's a plain .cache.yaml filename so
      // a malicious query string can't escape the cache dir.
      if (typeof name !== 'string' || !/^[A-Za-z0-9_\-.()]+\.cache\.yaml$/.test(name)) {
        return res.status(400).json({ error: 'invalid cache name' });
      }
      const file = path.join(MIDSCENE_CACHE_DIR, name);
      const removed = await fs.unlink(file).then(() => true).catch(() => false);
      if (!removed) return res.status(404).json({ error: 'cache file not found' });
      await audit(req, 'cache.cleared', { name });
      res.json({ ok: true, removed: 1 });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.use('/api/run', router);
}

export function registerRunWebsocket(wss) {
  wss.on('connection', async (ws, req) => {
    // Verify auth from the cookie header
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const i = c.indexOf('=');
        if (i < 0) return [c.trim(), ''];
        return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())];
      }),
    );
    const fakeReq = { cookies };
    const user = await tryAuth(fakeReq);
    if (!user || !hasPermission(user, 'results:read')) {
      try { ws.send(JSON.stringify({ type: 'error', error: 'unauthorized' })); } catch {}
      ws.close(4401, 'unauthorized');
      return;
    }
    wsClients.add(ws);
    ws.send(JSON.stringify({
      type: 'hello',
      status: publicStatus(),
      backlog: state.logs.slice(-200),
      events: state.events.slice(),
    }));
    ws.on('close', () => wsClients.delete(ws));
    ws.on('error', () => wsClients.delete(ws));
  });
}
