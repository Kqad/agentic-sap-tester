// Express router for the in-process Midscene JS pipeline that we ported from
// Desktop\saptest. Three user-facing actions:
//
//   POST /api/midscene-js/cases/:id/api-guide
//        Generate an apiGuide for a case by calling the LLM (NL → steps).
//        STUB: returns 501 until we port src/lib/llm.ts.
//
//   POST /api/midscene-js/cases/:id/run
//        Run the case's apiGuide as JS, in-process, with cache strategy
//        controlled by ?cache=read | ?cache=write (default: write).
//        Returns the final run record (status/log/report URL).
//
//   GET  /api/midscene-js/runs/active
//        Snapshot of currently in-flight runs for UI polling.
//
//   POST /api/midscene-js/runs/:runId/abort
//        Best-effort abort: triggers cleanup of browser/page handles.

import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { ROOT, CASES_DIR, RUNS_DIR } from '../paths.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';
import { runJavascript } from '../midscene/runner.js';
import {
  listActiveRuns,
  abortActiveRun,
  getActiveRun,
} from '../midscene/active-runs.js';
import { buildJavascriptCacheId } from '../midscene/cache-id.js';
import { generateMidsceneApiGuide } from '../midscene/llm.js';

const CACHE_DIR = path.join(ROOT, 'midscene_run', 'cache');

const router = express.Router();
router.use(requireAuth());

function isSafeId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_\-]+$/.test(id);
}

async function loadCase(id) {
  if (!isSafeId(id)) return null;
  const file = path.join(CASES_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  try {
    const body = JSON.parse(await fs.readFile(file, 'utf8'));
    return { id, ...body };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------- API
// Generate API guide from natural language. STUB for now.
// -------------------------------------------------------------------------
router.post(
  '/cases/:id/api-guide',
  requirePermission('cases:write'),
  async (req, res) => {
    const c = await loadCase(req.params.id);
    if (!c) return res.status(404).json({ error: 'case not found' });
    if (!c.naturalLanguage?.trim()) {
      return res
        .status(400)
        .json({ error: 'case has no naturalLanguage — fill it in first via Parameters tab.' });
    }

    await audit(req, 'midscene-js.api-guide.requested', {
      caseId: c.id,
      title: c.title,
      nlLength: c.naturalLanguage.length,
    });

    try {
      const guide = await generateMidsceneApiGuide({
        title: c.title ?? '',
        description: c.description ?? '',
        naturalLanguage: c.naturalLanguage,
        targetUrl: c.sapUrl ?? '',
      });

      // Persist back into the case JSON.
      // - Editing apiGuide does NOT invalidate cacheId under v4c hash (locator
      //   strings are what matter; default `value: "..."` literals are stripped
      //   before hashing). Only locator / step structure / tcode changes do.
      // - Clear `params` overrides: Gen API is the canonical "rebuild from NL"
      //   action, so the new apiGuide's default values (extracted from NL)
      //   should win at runtime. Any stale overrides from before this regen
      //   would otherwise silently shadow the new defaults. Users can re-add
      //   per-step overrides via the Parameters tab after Gen API.
      const file = path.join(CASES_DIR, `${c.id}.json`);
      const body = JSON.parse(await fs.readFile(file, 'utf8'));
      const clearedParamKeys = body.params && typeof body.params === 'object' && !Array.isArray(body.params)
        ? Object.keys(body.params)
        : [];
      body.apiGuide = guide;
      body.apiGuideNaturalLanguage = c.naturalLanguage;
      delete body.params;
      await fs.writeFile(file, JSON.stringify(body, null, 2) + '\n', 'utf8');

      await audit(req, 'midscene-js.api-guide.generated', {
        caseId: c.id,
        stepCount: guide.steps.length,
        warnings: guide.warnings.length,
        clearedParamKeys,
      });
      return res.json({ ok: true, apiGuide: guide, clearedParamKeys });
    } catch (err) {
      await audit(req, 'midscene-js.api-guide.error', {
        caseId: c.id,
        error: err?.message ?? String(err),
      });
      return res.status(500).json({ error: err?.message ?? String(err) });
    }
  },
);

// -------------------------------------------------------------------- API
// Run a case's apiGuide as JS, in-process. ?cache=read uses read-write
// strategy (replays existing cache). Default = write-only strategy.
// -------------------------------------------------------------------------
router.post(
  '/cases/:id/run',
  requirePermission('runs:execute'),
  async (req, res) => {
    const c = await loadCase(req.params.id);
    if (!c) return res.status(404).json({ error: 'case not found' });

    const cacheMode = req.query.cache === 'read' ? 'read' : 'write';
    const headed = req.body?.headed !== false; // default true
    const startedByUsername = req.user?.username ?? null;
    // Per-step cache bypass: array of step.order numbers to force-re-plan.
    // Filter to numeric values only — UI sends an array but be defensive.
    const noCacheSteps = Array.isArray(req.body?.noCacheSteps)
      ? req.body.noCacheSteps.filter((n) => Number.isFinite(Number(n))).map(Number)
      : [];

    await audit(req, 'midscene-js.run.started', {
      caseId: c.id,
      title: c.title,
      cacheMode,
      headed,
      noCacheSteps,
    });

    try {
      const record = await runJavascript(c, { cacheMode, headed, startedByUsername, noCacheSteps });
      await audit(req, 'midscene-js.run.finished', {
        runId: record.runId,
        caseId: c.id,
        status: record.status,
        durationMs: record.durationMs,
      });
      return res.json({ ok: record.status === 'passed', run: record });
    } catch (err) {
      await audit(req, 'midscene-js.run.error', {
        caseId: c.id,
        error: err?.message ?? String(err),
      });
      return res.status(500).json({ error: err?.message ?? String(err) });
    }
  },
);

// -------------------------------------------------------------------- API
// Active runs snapshot. UI polls this every ~2s.
// -------------------------------------------------------------------------
router.get(
  '/runs/active',
  requirePermission('results:read'),
  (_req, res) => {
    res.json({ active: listActiveRuns() });
  },
);

router.post(
  '/runs/:runId/abort',
  requirePermission('runs:stop'),
  async (req, res) => {
    const runId = req.params.runId;
    if (!isSafeId(runId.replace(/[.]/g, '_'))) {
      return res.status(400).json({ error: 'invalid runId' });
    }
    if (!getActiveRun(runId)) {
      return res.status(404).json({ error: 'run not active' });
    }
    const ok = await abortActiveRun(runId);
    await audit(req, 'midscene-js.run.aborted', { runId });
    res.json({ ok });
  },
);

// -------------------------------------------------------------------- API
// Re-run a past Midscene JS run with the same cacheMode + headed setting.
// We load the run record from run-history/, look up the original case, and
// dispatch a fresh run. Useful from the History tab to replay a passing run
// against an updated DOM, or to retry a failure.
// -------------------------------------------------------------------------
router.post(
  '/runs/:runId/rerun',
  requirePermission('runs:execute'),
  async (req, res) => {
    const runId = req.params.runId;
    const recordPath = path.join(RUNS_DIR, `${runId}.json`);
    if (!existsSync(recordPath)) {
      return res.status(404).json({ error: 'run record not found' });
    }
    let record;
    try {
      record = JSON.parse(await fs.readFile(recordPath, 'utf8'));
    } catch (e) {
      return res.status(500).json({ error: 'corrupt run record: ' + e.message });
    }
    if (record.mode !== 'javascript') {
      return res
        .status(400)
        .json({ error: 'this endpoint only re-runs Midscene JS runs; use /api/run for Playwright specs' });
    }
    const c = await loadCase(record.caseId);
    if (!c) {
      return res.status(404).json({ error: 'original case not found: ' + record.caseId });
    }

    const cacheMode = record.useCache ? 'read' : 'write';
    const headed = req.body?.headed ?? record.headed ?? true;
    const startedByUsername = req.user?.username ?? null;

    await audit(req, 'midscene-js.run.rerun-started', {
      sourceRunId: runId,
      caseId: c.id,
      cacheMode,
      headed,
    });

    try {
      const fresh = await runJavascript(c, { cacheMode, headed, startedByUsername });
      await audit(req, 'midscene-js.run.rerun-finished', {
        sourceRunId: runId,
        runId: fresh.runId,
        status: fresh.status,
      });
      return res.json({ ok: fresh.status === 'passed', sourceRunId: runId, run: fresh });
    } catch (err) {
      return res.status(500).json({ error: err?.message ?? String(err) });
    }
  },
);

// -------------------------------------------------------------------- API
// Per-case cache management. Lists every cache file whose embedded caseId
// matches, plus flags the *current* cache file (matching the case's current
// naturalLanguage + apiGuide hash). DELETE removes a single file.
// -------------------------------------------------------------------------
router.get(
  '/cases/:id/cache',
  requirePermission('results:read'),
  async (req, res) => {
    const c = await loadCase(req.params.id);
    if (!c) return res.status(404).json({ error: 'case not found' });
    let currentCacheId = null;
    try { currentCacheId = buildJavascriptCacheId(c); } catch { /* missing apiGuide is fine */ }

    let names = [];
    try { names = await fs.readdir(CACHE_DIR); } catch { /* dir may not exist yet */ }

    const prefix = `saptest-js-${c.id}-`;
    const out = [];
    for (const name of names) {
      if (!name.startsWith(prefix) || !name.endsWith('.cache.yaml')) continue;
      const full = path.join(CACHE_DIR, name);
      let st = null;
      try { st = await fs.stat(full); } catch { continue; }
      out.push({
        name,
        bytes: st.size,
        modifiedAt: st.mtime.toISOString(),
        cacheId: name.replace(/\.cache\.yaml$/, ''),
        isCurrent: currentCacheId ? name === `${currentCacheId}.cache.yaml` : false,
      });
    }
    out.sort((a, b) => (a.isCurrent === b.isCurrent ? b.modifiedAt.localeCompare(a.modifiedAt) : (a.isCurrent ? -1 : 1)));
    res.json({ caseId: c.id, currentCacheId, files: out });
  },
);

router.delete(
  '/cases/:id/cache/:file',
  requirePermission('runs:execute'),
  async (req, res) => {
    const c = await loadCase(req.params.id);
    if (!c) return res.status(404).json({ error: 'case not found' });
    const file = req.params.file;
    // Guard against path traversal: must be a .cache.yaml for THIS case id.
    const expectedPrefix = `saptest-js-${c.id}-`;
    if (!file.startsWith(expectedPrefix) || !file.endsWith('.cache.yaml') || file.includes('/') || file.includes('\\')) {
      return res.status(400).json({ error: 'invalid cache filename for this case' });
    }
    const full = path.join(CACHE_DIR, file);
    try {
      await fs.unlink(full);
      await audit(req, 'midscene-js.cache.deleted', { caseId: c.id, file });
      res.json({ ok: true });
    } catch (e) {
      if (e.code === 'ENOENT') return res.status(404).json({ error: 'cache file not found' });
      res.status(500).json({ error: e.message });
    }
  },
);

export default router;
