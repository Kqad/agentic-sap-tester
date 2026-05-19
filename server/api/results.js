// /api/results — list Midscene & Playwright artifacts so the UI can build a
// runs history. The HTML reports themselves are served by /reports/*.

import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { REPORT_DIR, RESULTS_DIR } from '../paths.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';

const router = express.Router();
router.use(requireAuth(), requirePermission('results:read'));

// Filenames look like:
//   playwright-merged-2026-05-18_16-48-09-1d09964a.html
//   playwright-SAP-Asset-Balance--Curr.bk.val.-==-Book-val.-<uuid>.html
function classify(name) {
  if (name.startsWith('playwright-merged-')) return 'merged';
  if (name.startsWith('playwright-')) return 'single';
  return 'other';
}

function tryParseTimestampFromMerged(name) {
  // playwright-merged-YYYY-MM-DD_HH-MM-SS-xxxxxxxx.html
  const m = name.match(/^playwright-merged-(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})-/);
  if (!m) return null;
  const [, Y, Mo, D, h, mi, s] = m;
  return new Date(`${Y}-${Mo}-${D}T${h}:${mi}:${s}`).toISOString();
}

router.get('/', async (_req, res) => {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const entries = await fs.readdir(REPORT_DIR, { withFileTypes: true });
  const items = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.html')) continue;
    const file = path.join(REPORT_DIR, e.name);
    const stat = await fs.stat(file);
    items.push({
      name: e.name,
      kind: classify(e.name),
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      timestamp: tryParseTimestampFromMerged(e.name) || stat.mtime.toISOString(),
      url: `/reports/${encodeURIComponent(e.name)}`,
    });
  }
  items.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

  let lastRun = null;
  try {
    const raw = await fs.readFile(path.join(RESULTS_DIR, '.last-run.json'), 'utf8');
    lastRun = JSON.parse(raw);
  } catch { /* ignore */ }

  // Aggregate stats
  const merged = items.filter(i => i.kind === 'merged');
  const stats = {
    totalArtifacts: items.length,
    mergedRuns: merged.length,
    latest: items[0] || null,
  };

  res.json({ items, lastRun, stats });
});

export default router;
