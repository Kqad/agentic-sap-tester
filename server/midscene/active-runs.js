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
    }))
    .sort((a, b) => a.startedAt - b.startedAt);
}
