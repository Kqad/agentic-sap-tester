// /api/results — list Midscene & Playwright artifacts so the UI can build a
// runs history. The HTML reports themselves are served by /reports/*.

import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CASES_DIR, REPORT_DIR, RESULTS_DIR, RUNS_DIR } from '../paths.js';
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

  // Per-call cache so multiple reports for the same case only re-read the
  // case JSON once. Missing cases (renamed/deleted) are remembered as null
  // so the disk lookup isn't repeated either.
  const titleCache = new Map();
  async function lookupCaseTitle(caseId) {
    if (!caseId) return null;
    if (titleCache.has(caseId)) return titleCache.get(caseId);
    let title = null;
    try {
      const raw = await fs.readFile(path.join(CASES_DIR, `${caseId}.json`), 'utf8');
      const parsed = JSON.parse(raw);
      title = typeof parsed?.title === 'string' ? parsed.title : null;
    } catch { /* case file gone — show caseId as fallback */ }
    titleCache.set(caseId, title);
    return title;
  }

  const items = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.html')) continue;
    const file = path.join(REPORT_DIR, e.name);
    const stat = await fs.stat(file);
    // Reports written by the jsrun runner share a base name with their
    // run-history record (<runId>.html ↔ <runId>.json). Playwright merged /
    // single reports use other naming → no matching record, run stays null.
    const runId = e.name.replace(/\.html$/, '');
    let run = null;
    try {
      const raw = await fs.readFile(path.join(RUNS_DIR, `${runId}.json`), 'utf8');
      const rec = JSON.parse(raw);
      const caseId = typeof rec?.caseId === 'string' ? rec.caseId : null;
      const caseTitle = await lookupCaseTitle(caseId);
      run = {
        caseId,
        caseTitle,
        status: typeof rec?.status === 'string' ? rec.status : null,
        durationMs: typeof rec?.durationMs === 'number' ? rec.durationMs : null,
      };
    } catch { /* no matching run record */ }
    items.push({
      name: e.name,
      kind: classify(e.name),
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      timestamp: tryParseTimestampFromMerged(e.name) || stat.mtime.toISOString(),
      url: `/reports/${encodeURIComponent(e.name)}`,
      run,
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

// Recent runs across all cases — drives the dashboard's "recent activity"
// panel after the dedicated Results view was removed.
router.get('/recent', async (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 10));
  await fs.mkdir(RUNS_DIR, { recursive: true });
  const entries = await fs.readdir(RUNS_DIR, { withFileTypes: true });
  const runs = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(RUNS_DIR, e.name), 'utf8');
      const rec = JSON.parse(raw);
      const { events, logTail, ...summary } = rec;
      runs.push(summary);
    } catch { /* skip malformed */ }
  }
  runs.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  res.json({ runs: runs.slice(0, limit) });
});

export default router;
