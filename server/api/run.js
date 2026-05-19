// /api/run + ws://.../ws/run — spawn `npm test` for a specific spec and
// stream stdout/stderr lines to all connected WebSocket clients. Only one
// run at a time. Authorized via requirePermission('runs:execute').

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import express from 'express';
import { ROOT, E2E_DIR, REPORT_DIR } from '../paths.js';
import { requireAuth, requirePermission, tryAuth } from '../auth/middleware.js';
import { hasPermission } from '../auth/rbac.js';
import { audit } from '../audit.js';

// Module-singleton run state.
const state = {
  running: false,
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  spec: null,
  pid: null,
  logs: [],          // ring buffer of recent lines
  child: null,
  startedByUserId: null,
  startedByUsername: null,
};
const LOG_BUFFER_MAX = 2000;

const wsClients = new Set();

function broadcast(msg) {
  const payload = JSON.stringify(msg);
  for (const ws of wsClients) {
    if (ws.readyState === 1) {
      try { ws.send(payload); } catch { /* ignore */ }
    }
  }
}

function pushLog(stream, line) {
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
    pid: state.pid,
    startedBy: state.startedByUsername,
    logLines: state.logs.length,
  };
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
    res.json({ logs: state.logs, status: publicStatus() });
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
    const args = ['test', headed ? 'test:headed' : 'test', '--', norm];

    // Reset state
    state.running = true;
    state.startedAt = new Date().toISOString();
    state.startedAtMs = Date.now();
    state.finishedAt = null;
    state.exitCode = null;
    state.spec = norm;
    state.logs = [];
    state.startedByUserId = req.user.id;
    state.startedByUsername = req.user.username;
    broadcast({ type: 'status', status: publicStatus() });

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npmCmd, ['run', headed ? 'test:headed' : 'test', '--', norm], {
      cwd: ROOT,
      env: { ...process.env },
      shell: false,
      windowsHide: true,
    });
    state.child = child;
    state.pid = child.pid;
    pushLog('info', `> ${npmCmd} run ${headed ? 'test:headed' : 'test'} -- ${norm}`);

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
    });
    child.on('close', async (code) => {
      state.running = false;
      state.finishedAt = new Date().toISOString();
      state.exitCode = code;
      state.child = null;
      state.pid = null;
      pushLog('info', `--- process exited with code ${code} ---`);
      const report = await findLatestMergedReport(state.startedAtMs - 1000);
      await audit({ user: { id: state.startedByUserId, username: state.startedByUsername, role: 'unknown' } },
        'runs.finished', { spec: state.spec, exitCode: code, report: report?.name });
      broadcast({ type: 'status', status: publicStatus(), report });
    });

    await audit(req, 'runs.started', { spec: norm, headed });
    res.json({ ok: true, status: publicStatus() });
  });

  router.post('/stop', requirePermission('runs:stop'), async (req, res) => {
    if (!state.running || !state.child) {
      return res.status(409).json({ error: 'no run in progress' });
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
    ws.send(JSON.stringify({ type: 'hello', status: publicStatus(), backlog: state.logs.slice(-200) }));
    ws.on('close', () => wsClients.delete(ws));
    ws.on('error', () => wsClients.delete(ws));
  });
}
