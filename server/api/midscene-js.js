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
import { ROOT, CASES_DIR, RUNS_DIR, SCREENSHOTS_DIR } from '../paths.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';
import { runJavascript } from '../midscene/runner.js';
import {
  listActiveRuns,
  abortActiveRun,
  getActiveRun,
} from '../midscene/active-runs.js';
import {
  buildJavascriptCacheId,
  resolveSlotCacheId,
  resolveSlotCachePath,
  resolveSnapshotPath,
} from '../midscene/cache-id.js';
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
    // `let` so we can swap in a clone with merged project-level param
    // overrides without mutating the on-disk library case.
    let c = await loadCase(req.params.id);
    if (!c) return res.status(404).json({ error: 'case not found' });

    const cacheMode = req.query.cache === 'read' ? 'read' : 'write';
    const headed = req.body?.headed !== false; // default true
    const startedByUsername = req.user?.username ?? null;
    // Per-step cache bypass: array of step.order numbers to force-re-plan.
    // Filter to numeric values only — UI sends an array but be defensive.
    const noCacheSteps = Array.isArray(req.body?.noCacheSteps)
      ? req.body.noCacheSteps.filter((n) => Number.isFinite(Number(n))).map(Number)
      : [];
    // keepCacheOnFailure: when true, the runner skips the failure-path
    // cache snapshot restore — partial / mid-flight cache writes survive
    // even when the run dies before reaching the end. Default false
    // (= existing pass-only-keep policy).
    const keepCacheOnFailure = req.body?.keepCacheOnFailure === true;
    // Project-level parameter overrides — the Run Center sends per-case
    // overrides when running from a project. They merge ON TOP of the
    // library case's default params. Library file stays untouched; only
    // this one run sees the overrides.
    const paramsOverride = (req.body?.params && typeof req.body.params === 'object' && !Array.isArray(req.body.params))
      ? req.body.params
      : null;
    if (paramsOverride) {
      // Clone the case so we don't mutate the loaded library object.
      // Merge: existing case params + project overrides (project wins).
      const merged = { ...(c.params || {}), ...paramsOverride };
      // Persist to a per-run shallow clone, NOT to disk.
      // eslint-disable-next-line no-param-reassign
      c = { ...c, params: merged };
    }

    await audit(req, 'midscene-js.run.started', {
      caseId: c.id,
      title: c.title,
      cacheMode,
      headed,
      noCacheSteps,
      keepCacheOnFailure,
      hasParamOverride: !!paramsOverride,
    });

    try {
      const record = await runJavascript(c, { cacheMode, headed, startedByUsername, noCacheSteps, keepCacheOnFailure });
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

// ───────── Flow-view: per-step screenshots ─────────
// Step screenshots are written to disk by the runner after each apiGuide
// step (see captureStepScreenshot in server/midscene/runner.js). Layout:
//   midscene_run/screenshots/<runId>/step-<order>.jpg
// These three endpoints expose them to the workbench flow view:
//   GET  /runs/:runId/screenshots        → list of available steps
//   GET  /runs/:runId/screenshot/:order  → the JPEG bytes for one step
// runId is treated as a safe-id (kebab + base32-ish characters), order
// is a 1–3 digit integer.

function isSafeRunId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_\-]+$/.test(id);
}

router.get(
  '/runs/:runId/screenshots',
  requirePermission('results:read'),
  async (req, res) => {
    const runId = req.params.runId;
    if (!isSafeRunId(runId)) return res.status(400).json({ error: 'invalid runId' });
    const dir = path.join(SCREENSHOTS_DIR, runId);
    let entries = [];
    try {
      const names = await fs.readdir(dir);
      for (const n of names) {
        const m = /^step-(\d+)\.jpg$/.exec(n);
        if (!m) continue;
        const order = Number(m[1]);
        const stat = await fs.stat(path.join(dir, n));
        entries.push({
          order,
          url: `/api/midscene-js/runs/${encodeURIComponent(runId)}/screenshot/${order}`,
          modifiedAt: stat.mtime.toISOString(),
          bytes: stat.size,
        });
      }
      entries.sort((a, b) => a.order - b.order);
    } catch (e) {
      // No directory yet (run hasn't captured anything) — return empty list.
    }
    res.json({ runId, screenshots: entries });
  },
);

router.get(
  '/runs/:runId/screenshot/:order',
  requirePermission('results:read'),
  async (req, res) => {
    const runId = req.params.runId;
    const order = Number(req.params.order);
    if (!isSafeRunId(runId) || !Number.isInteger(order) || order < 1 || order > 999) {
      return res.status(400).json({ error: 'invalid runId / order' });
    }
    const file = path.join(SCREENSHOTS_DIR, runId, `step-${order}.jpg`);
    if (!existsSync(file)) return res.status(404).json({ error: 'no screenshot' });
    res.setHeader('Content-Type', 'image/jpeg');
    // Short cache so the workbench can re-fetch when a step is re-run, but
    // doesn't hammer the disk on every poll for already-loaded thumbs.
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.sendFile(file);
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
    let currentPassCacheId = null;
    let currentFailCacheId = null;
    try { currentCacheId = buildJavascriptCacheId(c); } catch { /* missing apiGuide is fine */ }
    if (currentCacheId) {
      currentPassCacheId = resolveSlotCacheId(currentCacheId, 'pass');
      currentFailCacheId = resolveSlotCacheId(currentCacheId, 'fail');
    }

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
        isCurrent: currentCacheId ? (
          name === `${currentCacheId}.cache.yaml`
          || name === `${currentPassCacheId}.cache.yaml`
          || name === `${currentFailCacheId}.cache.yaml`
        ) : false,
        slot: name === `${currentPassCacheId}.cache.yaml` ? 'pass'
          : name === `${currentFailCacheId}.cache.yaml` ? 'fail'
          : name === `${currentCacheId}.cache.yaml` ? 'legacy'
          : null,
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

// -------------------------------------------------------------------- API
// Cache-debug endpoints. Power the Cache Debug modal in the workbench —
// per-case config for the two cache slots (pass + fail) plus a listing
// of past-run snapshots the user can pick as a source.
//
//   GET  /api/midscene-js/cases/:id/cache-debug
//        → { pass: { source, excludeSteps }, fail: { source, excludeSteps,
//                                                    dropTailCount },
//            snapshots: [{ runId, status, finishedAt, cacheSlot, hasFile,
//                          sizeBytes }],
//            currentPassFile: { exists, sizeBytes, mtime },
//            currentFailFile: { exists, sizeBytes, mtime },
//            apiGuideSteps: [{ order, title, midsceneApi }] }
//
//   PUT  /api/midscene-js/cases/:id/cache-debug
//        body: { pass: { source, excludeSteps },
//                fail: { source, excludeSteps, dropTailCount } }
//        Persists into case JSON's cacheSlotConfig. Next run picks it up.
// -------------------------------------------------------------------------

function normalizeSlotConfig(input, isFailSlot = false) {
  const out = {
    source: 'auto',
    excludeSteps: [],
  };
  if (input && typeof input === 'object') {
    if (typeof input.source === 'string' && input.source.trim()) {
      out.source = input.source.trim();
    }
    if (Array.isArray(input.excludeSteps)) {
      out.excludeSteps = input.excludeSteps
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0);
    }
    if (isFailSlot) {
      const d = Number(input.dropTailCount);
      out.dropTailCount = Number.isFinite(d) && d >= 0 ? d : 2;
    }
  } else if (isFailSlot) {
    out.dropTailCount = 2;
  }
  return out;
}

router.get(
  '/cases/:id/cache-debug',
  requirePermission('cases:read'),
  async (req, res) => {
    const c = await loadCase(req.params.id);
    if (!c) return res.status(404).json({ error: 'case not found' });

    const cfg = c.cacheSlotConfig ?? {};
    const passCfg = normalizeSlotConfig(cfg.pass ?? null, false);
    const failCfg = normalizeSlotConfig(cfg.fail ?? null, true);

    // List per-run snapshots from run-history for this caseId. Newest first.
    const snapshots = [];
    try {
      const entries = await fs.readdir(RUNS_DIR);
      const ordered = entries.filter((n) => n.endsWith('.json')).sort((a, b) => b.localeCompare(a));
      for (const name of ordered) {
        let rec;
        try {
          rec = JSON.parse(await fs.readFile(path.join(RUNS_DIR, name), 'utf8'));
        } catch { continue; }
        if (rec?.caseId !== c.id) continue;
        const snapPath = resolveSnapshotPath(rec.runId);
        let hasFile = false, sizeBytes = null;
        try {
          const st = await fs.stat(snapPath);
          hasFile = true; sizeBytes = st.size;
        } catch { /* no snapshot for this run */ }
        snapshots.push({
          runId: rec.runId,
          status: rec.status,
          cacheSlot: rec.cacheSlot ?? null,
          finishedAt: rec.finishedAt,
          durationMs: rec.durationMs,
          stepCount: rec.runSummary?.assertions?.length != null ? undefined : undefined,
          hasFile,
          sizeBytes,
        });
        if (snapshots.length >= 80) break; // cap so UI list stays usable
      }
    } catch { /* run-history missing → empty list */ }

    // Current slot file states (used by the modal's "currently active" header).
    const baseCacheId = buildJavascriptCacheId(c);
    const slotInfo = async (slot) => {
      const p = resolveSlotCachePath(baseCacheId, slot);
      try {
        const st = await fs.stat(p);
        return { exists: true, sizeBytes: st.size, mtime: st.mtime.toISOString() };
      } catch {
        return { exists: false, sizeBytes: null, mtime: null };
      }
    };

    return res.json({
      caseId: c.id,
      pass: passCfg,
      fail: failCfg,
      snapshots,
      currentPassFile: await slotInfo('pass'),
      currentFailFile: await slotInfo('fail'),
      apiGuideSteps: (c.apiGuide?.steps ?? []).map((s) => ({
        order: s.order,
        title: s.title,
        midsceneApi: s.midsceneApi,
      })),
    });
  },
);

router.put(
  '/cases/:id/cache-debug',
  requirePermission('cases:write'),
  async (req, res) => {
    if (!isSafeId(req.params.id)) return res.status(400).json({ error: 'bad id' });
    const file = path.join(CASES_DIR, `${req.params.id}.json`);
    if (!existsSync(file)) return res.status(404).json({ error: 'case not found' });

    const body = req.body ?? {};
    const passCfg = normalizeSlotConfig(body.pass, false);
    const failCfg = normalizeSlotConfig(body.fail, true);

    // Validate: any non-auto source must point to a runId whose
    // snapshot file actually exists. Otherwise the pin is silently
    // useless (the runner would fall back to auto) — better to refuse
    // it up front so the user knows.
    for (const [label, cfg] of [['pass', passCfg], ['fail', failCfg]]) {
      if (cfg.source && cfg.source !== 'auto') {
        const snapPath = resolveSnapshotPath(cfg.source);
        if (!existsSync(snapPath)) {
          return res.status(400).json({
            error: `${label} slot source "${cfg.source}" has no cache snapshot. ` +
                   `Only runs that completed AFTER the per-run snapshot system was deployed can be pinned. ` +
                   `Pick a more recent run or leave the source on "auto".`,
          });
        }
      }
    }

    try {
      const obj = JSON.parse(await fs.readFile(file, 'utf8'));
      obj.cacheSlotConfig = { pass: passCfg, fail: failCfg };
      await fs.writeFile(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
      await audit(req, 'midscene-js.cache-debug.updated', {
        caseId: req.params.id,
        passSource: passCfg.source,
        passExcludes: passCfg.excludeSteps.length,
        failSource: failCfg.source,
        failExcludes: failCfg.excludeSteps.length,
        failDropTail: failCfg.dropTailCount,
      });
      return res.json({ ok: true, cacheSlotConfig: { pass: passCfg, fail: failCfg } });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
);

export default router;
