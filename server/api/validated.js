// Validated-cases registry.
//
// Stores the list of case ids that should appear in the user-facing Run
// Center (run-center.html). Backed by a JSON file under server/data/ so
// promotions/demotions survive restarts.
//
// Endpoints:
//   GET    /api/validated          → { ids: [...] }            (any auth)
//   POST   /api/validated/:id      → { ids: [...] } add        (cases:write)
//   DELETE /api/validated/:id      → { ids: [...] } remove     (cases:write)

import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from '../paths.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';

const router = express.Router();

const STORE = path.join(ROOT, 'server', 'data', 'validated-cases.json');

// Seed defaults — the 11 saptest cases the user UI shipped with originally.
// First load with no file on disk falls back to these so existing users
// don't see an empty Run Center after they pull the update.
const DEFAULT_IDS = Array.from({ length: 11 }, (_, i) => `saptest${i + 1}`);

async function loadIds() {
  try {
    const txt = await fs.readFile(STORE, 'utf8');
    const data = JSON.parse(txt);
    return Array.isArray(data?.ids) ? data.ids : DEFAULT_IDS;
  } catch {
    return DEFAULT_IDS.slice();
  }
}

async function saveIds(ids, who) {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  const body = JSON.stringify({
    ids,
    updatedAt: new Date().toISOString(),
    updatedBy: who || null,
  }, null, 2);
  await fs.writeFile(STORE, body);
}

router.use(requireAuth());

router.get('/', async (_req, res) => {
  res.json({ ids: await loadIds() });
});

router.post('/:id', requirePermission('cases:write'), async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'missing id' });
  const ids = await loadIds();
  if (!ids.includes(id)) ids.push(id);
  await saveIds(ids, req.user?.username);
  await audit(req, 'validated.promote', { id });
  res.json({ ids });
});

router.delete('/:id', requirePermission('cases:write'), async (req, res) => {
  const id = String(req.params.id || '').trim();
  const ids = (await loadIds()).filter((x) => x !== id);
  await saveIds(ids, req.user?.username);
  await audit(req, 'validated.demote', { id });
  res.json({ ids });
});

export default router;
