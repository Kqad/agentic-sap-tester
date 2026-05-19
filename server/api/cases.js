// CRUD over JSON test-case parameter files in e2e/cases/*.json.
// Each case is a JSON file whose name (without .json) is its id.
// We also enumerate spec files in e2e/*.spec.ts and surface them as
// read-only "specs" so the UI can show which TypeScript driver each
// case binds to.

import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CASES_DIR, E2E_DIR } from '../paths.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';

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
  return {
    title: p.title || p.$schema || null,
    transactionCode: p.transactionCode || null,
    favoritesEntry: p.favoritesEntry || null,
    sapUrl: p.sapUrl || null,
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
  res.json({ ok: true, id, isNew });
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

export default router;
