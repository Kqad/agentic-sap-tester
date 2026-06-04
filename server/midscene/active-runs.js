// In-memory registry of in-flight Midscene JS runs. Mirrors the Desktop
// project's src/lib/active-runs.ts (renamed to ESM JS, no types). Used by the
// UI badge / step panel that polls /api/midscene-js/runs/active.

const REGISTRY_KEY = '__saptest1_active_midscene_runs__';

const registry =
  globalThis[REGISTRY_KEY] ?? (globalThis[REGISTRY_KEY] = new Map());

export function registerActiveRun({ runId, caseId, caseTitle, mode, totalSteps }) {
  const entry = {
    runId,
    caseId,
    caseTitle,
    mode,
    startedAt: Date.now(),
    totalSteps,
    currentStep: null,
    abortController: new AbortController(),
    cleanupTasks: [],
    aborted: false,
    logTail: [],
    // Screenshots captured by the runner per step. Each entry:
    //   { order, capturedAt, status: 'passed'|'failed', cached: bool|null }
    // The actual JPEG sits on disk at midscene_run/screenshots/<runId>/step-<order>.jpg
    // served by /api/midscene-js/runs/:runId/screenshot/:order (see api/midscene-js.js).
    screenshots: [],
  };
  registry.set(runId, entry);
  return entry;
}

export function unregisterActiveRun(runId) {
  registry.delete(runId);
}

export function getActiveRun(runId) {
  return registry.get(runId);
}

export function setActiveRunStep(runId, step) {
  const e = registry.get(runId);
  if (e) e.currentStep = step;
}

export function appendActiveRunLog(runId, line) {
  const e = registry.get(runId);
  if (!e) return;
  e.logTail.push({ ts: Date.now(), line });
  if (e.logTail.length > 200) e.logTail.splice(0, e.logTail.length - 200);
}

// Record that a step's screenshot was just written to disk. Dedup by order —
// subsequent calls for the same order overwrite the entry (e.g. retry path).
export function recordActiveRunScreenshot(runId, { order, status, cached }) {
  const e = registry.get(runId);
  if (!e) return;
  const existing = e.screenshots.findIndex((s) => s.order === order);
  const entry = { order, capturedAt: Date.now(), status, cached: cached ?? null };
  if (existing >= 0) e.screenshots[existing] = entry;
  else e.screenshots.push(entry);
}

export function attachActiveRunCleanup(runId, tasks) {
  const e = registry.get(runId);
  if (e) e.cleanupTasks = tasks;
}

export async function abortActiveRun(runId) {
  const e = registry.get(runId);
  if (!e) return false;
  e.aborted = true;
  e.abortController.abort();
  for (const t of [...e.cleanupTasks].reverse()) {
    try { await t.fn?.(); } catch { /* ignore */ }
  }
  e.cleanupTasks = [];
  return true;
}

export function listActiveRuns() {
  const now = Date.now();
  return [...registry.values()]
    .map((e) => ({
      runId: e.runId,
      caseId: e.caseId,
      caseTitle: e.caseTitle,
      mode: e.mode,
      startedAt: e.startedAt,
      elapsedMs: now - e.startedAt,
      totalSteps: e.totalSteps,
      currentStep: e.currentStep,
      aborted: e.aborted,
      logTail: e.logTail.slice(-30),
      screenshots: e.screenshots.slice(),
    }))
    .sort((a, b) => a.startedAt - b.startedAt);
}
