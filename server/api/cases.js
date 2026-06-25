// CRUD over JSON test-case parameter files in e2e/cases/*.json.
// Each case is a JSON file whose name (without .json) is its id.
// We also enumerate spec files in e2e/*.spec.ts and surface them as
// read-only "specs" so the UI can show which TypeScript driver each
// case binds to.

import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { CASES_DIR, E2E_DIR, RUNS_DIR } from '../paths.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';
import { parseSpecSteps } from '../lib/spec-steps.js';
import { ensureTemplateCacheForCase } from '../midscene/template-cache.js';

const router = express.Router();
router.use(requireAuth());

function safeId(id) {
  if (typeof id !== 'string') return null;
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) return null;
  return id;
}

async function listCases() {
  await fs.mkdir(CASES_DIR, { recursive: true });
  const entries = await fs.readdir(CASES_DIR, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.json')) continue;
    const id = e.name.replace(/\.json$/, '');
    const file = path.join(CASES_DIR, e.name);
    const stat = await fs.stat(file);
    let parsed = null, parseError = null;
    try {
      parsed = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (err) {
      parseError = err.message;
    }
    const specPath = path.join(E2E_DIR, `${id}.spec.ts`);
    const hasSpec = await fs.access(specPath).then(() => true).catch(() => false);
    out.push({
      id,
      file: path.relative(path.dirname(CASES_DIR), file).replace(/\\/g, '/'),
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      specPath: hasSpec ? `e2e/${id}.spec.ts` : null,
      parseError,
      summary: parsed ? summarize(parsed) : null,
    });
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

function summarize(p) {
  if (!p || typeof p !== 'object') return null;
  const guide = p.apiGuide;
  const apiStepCount =
    guide && Array.isArray(guide.steps) ? guide.steps.length : 0;
  // Truncate long descriptions so list endpoint stays lean.
  // 320 chars is enough for the run-center categorizer to pick up keywords
  // (e.g. "Asset HistorySheet", "Manage Accounts Payable", "CIT") without
  // shipping the full multi-paragraph description.
  const desc = typeof p.description === 'string' ? p.description.slice(0, 320) : null;
  return {
    title: p.title || p.$schema || null,
    description: desc,
    transactionCode: p.transactionCode || null,
    favoritesEntry: p.favoritesEntry || null,
    sapUrl: p.sapUrl || null,
    hasApiGuide: apiStepCount > 0,
    apiStepCount,
    desktopImport: !!p?.source?.desktop,
  };
}

router.get('/', requirePermission('cases:read'), async (_req, res) => {
  res.json({ cases: await listCases() });
});

router.get('/:id', requirePermission('cases:read'), async (req, res) => {
  const id = safeId(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const file = path.join(CASES_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    res.json({ id, raw, parsed: JSON.parse(raw) });
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'not found' });
    res.status(500).json({ error: e.message });
  }
});

// PUT replaces the whole case body. Body must be valid JSON.
router.put('/:id', requirePermission('cases:write'), async (req, res) => {
  const id = safeId(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'body must be a JSON object' });
  }
  const file = path.join(CASES_DIR, `${id}.json`);
  await fs.mkdir(CASES_DIR, { recursive: true });
  const isNew = !(await fs.access(file).then(() => true).catch(() => false));
  await fs.writeFile(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
  await audit(req, isNew ? 'cases.create' : 'cases.update', { id });

  // On new-case creation, try to seed the cache from SAPTEST_TEMPLATE_CASE_ID
  // so the user can run "Run JS w/ Cache" without first recording one. Steps
  // whose locators match the template (e.g. SAP login / menu navigation) will
  // hit; the rest fall through to LLM/cache-write as usual.
  let templateCache = null;
  if (isNew) {
    try {
      const result = ensureTemplateCacheForCase({ id, ...body });
      templateCache = result;
      if (result.copied) {
        await audit(req, 'cases.template-cache.copied', { id, sourcePath: result.sourcePath });
      }
    } catch (e) {
      console.warn(`[cases PUT] template cache seed failed for ${id}: ${e?.message ?? e}`);
    }
  }

  res.json({ ok: true, id, isNew, templateCache });
});

// Template fetch: returns the JSON body of the case pointed to by
// SAPTEST_TEMPLATE_CASE_ID, so the UI can pre-fill the "new case" modal
// with sensible defaults (sapUrl, transactionCode skeleton, NL example).
router.get('/_meta/template', requirePermission('cases:read'), async (_req, res) => {
  const templateId = (process.env.SAPTEST_TEMPLATE_CASE_ID ?? '').trim();
  if (!templateId) {
    return res.json({ templateId: null, parsed: null, reason: 'SAPTEST_TEMPLATE_CASE_ID not set' });
  }
  if (!safeId(templateId)) {
    return res.json({ templateId, parsed: null, reason: 'invalid templateId' });
  }
  const file = path.join(CASES_DIR, `${templateId}.json`);
  if (!existsSync(file)) {
    return res.json({ templateId, parsed: null, reason: 'template case file not found' });
  }
  try {
    const raw = await fs.readFile(file, 'utf8');
    res.json({ templateId, parsed: JSON.parse(raw) });
  } catch (e) {
    res.json({ templateId, parsed: null, reason: e.message });
  }
});

router.delete('/:id', requirePermission('cases:delete'), async (req, res) => {
  const id = safeId(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const file = path.join(CASES_DIR, `${id}.json`);
  try {
    await fs.unlink(file);
    await audit(req, 'cases.delete', { id });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'not found' });
    res.status(500).json({ error: e.message });
  }
});

// Rename a case: caseId is the filename, so a "rename" is really:
//   1. mv e2e/cases/<old>.json e2e/cases/<new>.json
//   2. mv run-history/cases/<old>/ run-history/cases/<new>/  (if present)
//   3. rename any midscene_run/cache/saptest-js-<old>-*.cache.yaml so the
//      cache continues to apply to the renamed case
// Spec files (e2e/<id>.spec.ts) are NOT renamed automatically — they
// belong to the Playwright fleet, not the Midscene-JS case shape. If a
// spec exists it's left in place and the UI flags the mismatch.
router.patch('/:id/rename', requirePermission('cases:write'), async (req, res) => {
  const oldId = safeId(req.params.id);
  const newId = safeId(req.body?.newId);
  if (!oldId || !newId) return res.status(400).json({ error: 'invalid id (letters, digits, - and _ only)' });
  if (oldId === newId) return res.status(400).json({ error: 'new id is the same as old id' });

  const oldFile = path.join(CASES_DIR, `${oldId}.json`);
  const newFile = path.join(CASES_DIR, `${newId}.json`);
  if (!existsSync(oldFile)) return res.status(404).json({ error: 'case not found' });
  if (existsSync(newFile)) return res.status(409).json({ error: 'a case with that id already exists' });

  try {
    await fs.rename(oldFile, newFile);
  } catch (e) {
    return res.status(500).json({ error: 'rename failed: ' + e.message });
  }

  // Best-effort secondary renames — failures don't abort the case rename,
  // they're just logged. The case rename itself already succeeded.
  const secondary = [];
  // a) run-history directory
  try {
    const oldRunDir = path.join(RUNS_DIR, 'cases', oldId);
    const newRunDir = path.join(RUNS_DIR, 'cases', newId);
    if (existsSync(oldRunDir)) {
      await fs.rename(oldRunDir, newRunDir);
      secondary.push({ kind: 'run-history', oldPath: oldRunDir, newPath: newRunDir });
    }
  } catch (e) { secondary.push({ kind: 'run-history', error: e.message }); }
  // b) Midscene cache files — filename pattern `saptest-js-<id>-<hash>.cache.yaml`
  try {
    const CACHE_DIR = path.join(path.dirname(CASES_DIR), '..', 'midscene_run', 'cache');
    if (existsSync(CACHE_DIR)) {
      const entries = await fs.readdir(CACHE_DIR);
      const re = new RegExp('^saptest-js-' + oldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '-(.+)\\.cache\\.yaml$');
      for (const name of entries) {
        const m = re.exec(name);
        if (!m) continue;
        const oldPath = path.join(CACHE_DIR, name);
        const newName = `saptest-js-${newId}-${m[1]}.cache.yaml`;
        await fs.rename(oldPath, path.join(CACHE_DIR, newName));
        secondary.push({ kind: 'cache', oldName: name, newName });
      }
    }
  } catch (e) { secondary.push({ kind: 'cache', error: e.message }); }

  await audit(req, 'cases.rename', { oldId, newId, secondary });
  res.json({ ok: true, oldId, newId, secondary });
});

// Spec discovery: list e2e/*.spec.ts so the UI can show what specs exist.
router.get('/_specs/list', requirePermission('cases:read'), async (_req, res) => {
  const entries = await fs.readdir(E2E_DIR, { withFileTypes: true });
  const specs = [];
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.spec.ts')) {
      const file = path.join(E2E_DIR, e.name);
      const stat = await fs.stat(file);
      specs.push({
        name: e.name,
        path: `e2e/${e.name}`,
        bytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    }
  }
  res.json({ specs });
});

router.get('/_specs/:name', requirePermission('cases:read'), async (req, res) => {
  const name = req.params.name;
  if (!/^[a-zA-Z0-9_\-.]+\.spec\.ts$/.test(name)) {
    return res.status(400).json({ error: 'invalid spec name' });
  }
  const file = path.join(E2E_DIR, name);
  try {
    const text = await fs.readFile(file, 'utf8');
    res.json({ name, text });
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'not found' });
    res.status(500).json({ error: e.message });
  }
});

// Static step preview: parse spec via TS AST and return a structured step
// tree so the UI can render what this case will do *before* it's executed.
// Also merges values from the matching e2e/cases/<id>.json so the preview
// can show resolved params next to `${params.xxx}` placeholders.
router.get('/_specs/:name/steps', requirePermission('cases:read'), async (req, res) => {
  const name = req.params.name;
  if (!/^[a-zA-Z0-9_\-.]+\.spec\.ts$/.test(name)) {
    return res.status(400).json({ error: 'invalid spec name' });
  }
  const file = path.join(E2E_DIR, name);
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'not found' });
    return res.status(500).json({ error: e.message });
  }

  let tree;
  try {
    tree = parseSpecSteps(`e2e/${name}`, text);
  } catch (e) {
    return res.status(500).json({ error: 'parse failed', detail: e.message });
  }

  // Best-effort load of the matching parameters JSON so the UI can resolve
  // simple `params.foo.bar` references when previewing.
  const caseId = name.replace(/\.spec\.ts$/, '');
  let params = null;
  try {
    const raw = await fs.readFile(path.join(CASES_DIR, `${caseId}.json`), 'utf8');
    params = JSON.parse(raw);
  } catch { /* no params is fine */ }

  res.json({ name, ...tree, params });
});

// History: list persisted run records for a single case (newest first).
// Each record was written by server/api/run.js when the spawn closed.
router.get('/:id/runs', requirePermission('results:read'), async (req, res) => {
  const id = safeId(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  await fs.mkdir(RUNS_DIR, { recursive: true });
  const entries = await fs.readdir(RUNS_DIR, { withFileTypes: true });
  const runs = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(RUNS_DIR, e.name), 'utf8');
      const rec = JSON.parse(raw);
      if (rec.caseId !== id) continue;
      // Trim events out of the list response — clients fetch them per-run.
      const { events, logTail, ...summary } = rec;
      runs.push(summary);
    } catch { /* skip malformed */ }
  }
  runs.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  res.json({ caseId: id, runs });
});

router.get('/:id/runs/:runId', requirePermission('results:read'), async (req, res) => {
  const id = safeId(req.params.id);
  const runId = req.params.runId;
  if (!id || !/^[a-zA-Z0-9_\-]+$/.test(runId)) return res.status(400).json({ error: 'invalid id' });
  const file = path.join(RUNS_DIR, `${runId}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const rec = JSON.parse(raw);
    if (rec.caseId !== id) return res.status(404).json({ error: 'not found' });
    res.json(rec);
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'not found' });
    res.status(500).json({ error: e.message });
  }
});

// Delete a single run record. Only removes the JSON history file — the
// Midscene HTML report itself stays under midscene_run/report/ so other
// runs that reference it (and the Results dashboard) keep working.
router.delete('/:id/runs/:runId', requirePermission('cases:delete'), async (req, res) => {
  const id = safeId(req.params.id);
  const runId = req.params.runId;
  if (!id || !/^[a-zA-Z0-9_\-]+$/.test(runId)) return res.status(400).json({ error: 'invalid id' });
  const file = path.join(RUNS_DIR, `${runId}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const rec = JSON.parse(raw);
    if (rec.caseId !== id) return res.status(404).json({ error: 'not found' });
    await fs.unlink(file);
    await audit(req, 'runs.deleted', { caseId: id, runId });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'not found' });
    res.status(500).json({ error: e.message });
  }
});

// Bulk: wipe all run history for one case. Useful after a stable refactor
// when stale fail/pass history is just noise.
router.delete('/:id/runs', requirePermission('cases:delete'), async (req, res) => {
  const id = safeId(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  await fs.mkdir(RUNS_DIR, { recursive: true });
  const entries = await fs.readdir(RUNS_DIR, { withFileTypes: true });
  let deleted = 0;
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.json')) continue;
    const file = path.join(RUNS_DIR, e.name);
    try {
      const rec = JSON.parse(await fs.readFile(file, 'utf8'));
      if (rec.caseId !== id) continue;
      await fs.unlink(file);
      deleted++;
    } catch { /* skip malformed */ }
  }
  await audit(req, 'runs.cleared', { caseId: id, deleted });
  res.json({ ok: true, deleted });
});

export default router;
