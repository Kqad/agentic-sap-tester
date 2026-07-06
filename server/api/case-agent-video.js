// /api/case-agent/video-to-case — queue-based version (Option C)
//
// The client uploads the video + metadata; we drop it into a queue
// folder on disk and return an id. The user then asks Claude Code to
// process the queue ("请把队列里的视频转成 case"). Claude reads the
// video, extracts frames, produces the case JSON, and writes it into
// the result folder next to the queue entry. Meanwhile the client
// polls /video-to-case/status/:id and picks up the result the moment
// it appears.
//
// Why queue instead of direct Claude API:
//   - User's Max subscription covers Claude Code but not the /messages
//     API (separate billing). Using Claude Code = free within Max quota.
//   - We keep the whole conversion decision-making in the Claude Code
//     session where the user can watch it happen, ask questions,
//     iterate on the assertion, etc.
//
// Folder layout under project root:
//   _frames/video-queue/pending/<id>/  video.mp4
//                                     meta.json  (title / assertion / uploadedAt)
//   _frames/video-queue/done/<id>/     case.json  (finished · client-poll picks up)
//                                      log.md    (Claude's optional narrative)

import express from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';
import { retrieve as retrieveKb, refreshIndex } from '../kb/retriever.js';

// ── ffmpeg helper ────────────────────────────────────────────────────
function which(cmd) {
  return new Promise((resolve) => {
    const w = process.platform === 'win32' ? 'where' : 'which';
    const p = spawn(w, [cmd]);
    let out = '';
    p.stdout.on('data', (b) => { out += b.toString(); });
    p.on('close', () => resolve(out.split(/\r?\n/).filter(Boolean)[0] || null));
    p.on('error', () => resolve(null));
  });
}
// Hybrid frame extraction:
//   Pass 1 · fps=1 baseline → catches steady-state screens (form filled,
//            page loaded, sitting-and-waiting moments).
//   Pass 2 · scene-change detection with threshold 0.15 → catches the
//            fast transitions (menu popped, dialog fired, page jumped)
//            that a 1s uniform grid may fall inside of.
//
// Frames saved with a numeric timestamp prefix so `sort()` gives them
// back in wall-clock order. Duplicates within 0.5s are pruned at the
// end so we don't ship two near-identical images to the analyzer.
async function extractFramesHybrid(videoPath, outDir) {
  await fsp.mkdir(outDir, { recursive: true });
  const ffmpeg = await which('ffmpeg');
  if (!ffmpeg) throw new Error('ffmpeg not on PATH');

  // Pass 1: uniform 1 fps grid. Filenames baseline_<seconds>.jpg.
  const runFfmpeg = (args) => new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, args);
    let err = '';
    p.stderr.on('data', (b) => { err += b.toString(); });
    p.on('close', (code) => code === 0 ? resolve(err) : reject(new Error(`ffmpeg exit ${code}: ${err.slice(-200)}`)));
  });

  // Pass 1 — write as f_%03d.jpg; each frame corresponds to second N (fps=1).
  // scale=1280 short-side keeps SAP text sharp while cutting each frame's
  // vision-token cost ~40% for the analyzer downstream. force_original_
  // aspect_ratio=decrease + -2 both guarantee even height (required by
  // JPEG encoder). Never upscale (min of source width).
  await runFfmpeg([
    '-y', '-i', videoPath,
    '-vf', "fps=1,scale='min(1280,iw)':-2",
    '-q:v', '3',
    path.join(outDir, 'f_%03d.jpg'),
  ]);
  const baseFrames = (await fsp.readdir(outDir))
    .filter((f) => /^f_\d+\.jpg$/.test(f))
    .map((f) => {
      const idx = Number(f.match(/^f_(\d+)\.jpg$/)[1]);
      return { name: f, timeSec: idx - 1 }; // f_001.jpg = second 0
    });

  // Pass 2 — scene changes at threshold 0.15. showinfo dumps pts_time
  // to stderr for each accepted frame; we parse those to name each
  // scene frame with its actual timestamp.
  const stderr = await runFfmpeg([
    '-y', '-i', videoPath,
    '-vf', "select='gt(scene,0.15)',showinfo,scale='min(1280,iw)':-2",
    '-vsync', 'vfr',
    '-q:v', '3',
    path.join(outDir, 's_%03d.jpg'),
  ]);
  // Parse: [Parsed_showinfo_… pts:… pts_time:14.366667 …]
  const sceneTimes = [];
  for (const m of stderr.matchAll(/pts_time:(\d+(?:\.\d+)?)/g)) {
    sceneTimes.push(Number(m[1]));
  }
  const sceneFiles = (await fsp.readdir(outDir))
    .filter((f) => /^s_\d+\.jpg$/.test(f))
    .sort();
  // Rename s_%03d.jpg → sc_<ts>.jpg so time order is trivial.
  for (let i = 0; i < sceneFiles.length; i += 1) {
    const ts = sceneTimes[i];
    if (ts == null) continue;
    const oldP = path.join(outDir, sceneFiles[i]);
    const newP = path.join(outDir, `sc_${ts.toFixed(2).padStart(7, '0')}.jpg`);
    await fsp.rename(oldP, newP).catch(() => {});
  }

  // Read final state — both baseline + scene frames — and sort by time.
  const allFiles = await fsp.readdir(outDir);
  const combined = [];
  for (const f of allFiles) {
    if (/^f_(\d+)\.jpg$/.test(f)) {
      combined.push({ file: f, time: Number(f.match(/^f_(\d+)\.jpg$/)[1]) - 1, kind: 'baseline' });
    } else if (/^sc_([\d.]+)\.jpg$/.test(f)) {
      combined.push({ file: f, time: Number(f.match(/^sc_([\d.]+)\.jpg$/)[1]), kind: 'scene' });
    }
  }
  combined.sort((a, b) => a.time - b.time);

  // Dedupe: within 0.5s, keep the scene-change one (more informative).
  const kept = [];
  for (const c of combined) {
    const last = kept[kept.length - 1];
    if (last && Math.abs(c.time - last.time) < 0.5) {
      // Prefer scene-change over baseline when they're close.
      if (c.kind === 'scene' && last.kind === 'baseline') {
        kept.pop();
        kept.push(c);
      }
      continue;
    }
    kept.push(c);
  }

  // Physically remove the pruned files so the on-disk state matches.
  const keepSet = new Set(kept.map((k) => k.file));
  for (const f of allFiles) {
    if ((f.startsWith('f_') || f.startsWith('sc_') || f.startsWith('s_')) && !keepSet.has(f)) {
      await fsp.rm(path.join(outDir, f), { force: true }).catch(() => {});
    }
  }
  return { total: kept.length, baseline: kept.filter((k) => k.kind === 'baseline').length, scene: kept.filter((k) => k.kind === 'scene').length };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const QUEUE_ROOT   = path.join(ROOT, '_frames', 'video-queue');
const PENDING_DIR  = path.join(QUEUE_ROOT, 'pending');
const DONE_DIR     = path.join(QUEUE_ROOT, 'done');

// ── KB retrieval helper (used at enqueue time) ─────────────────────
// Runs retrieve() with the user's title + assertion as the query, and
// writes a markdown block to pending/<id>/kb-hints.md. That file is what
// the video-to-case converter (Claude Code or the future auto pipeline)
// reads to know which KB chunks are most relevant to this specific case
// —— without having to embed the whole KB every time.
//
// Failures are non-fatal; we just skip the hints file. Empty index → skip.
async function writeKbHintsFor(pendingDir, title, assertion) {
  try {
    const q = [title, assertion].filter(Boolean).join(' · ').slice(0, 800);
    if (!q) return null;
    const r = await retrieveKb(q, { k: 4, scope: 'conversion' })
      .catch(async () => retrieveKb(q, { k: 4 }));  // scope filter is tight; fallback to any scope
    const hits = r?.hits || [];
    if (!hits.length) return null;
    const md = [
      `# KB hints for this video → case conversion`,
      ``,
      `_Query_: \`${q.replace(/`/g, '\\`')}\``,
      `_Retrieved_: ${new Date().toISOString()} · top-${hits.length} of ${r.candidateCount || '?'} candidates`,
      ``,
      ...hits.map((h, i) => [
        `## 【${i + 1}】${h.section || '(no section)'} · score=${h.score}`,
        ``,
        `Source: \`${h.relPath}\``,
        h.tags?.length ? `Tags: ${h.tags.join(', ')}` : '',
        ``,
        h.text,
        ``,
      ].filter(Boolean).join('\n')),
    ].join('\n');
    await fsp.writeFile(path.join(pendingDir, 'kb-hints.md'), md, 'utf8');
    return hits.length;
  } catch (e) {
    console.warn('[video-to-case] KB retrieve failed:', e.message);
    return null;
  }
}

// ── Reference-case skeleton (structural template, no locators) ─────
// Scans e2e/cases/*.json, scores each by (T-code exact match + title word
// overlap), picks top-1, and writes ONLY its structural template — API
// sequence, step count, split granularity — to reference-skeleton.md.
// We deliberately omit locator text so the converter doesn't literally
// copy the reference's descriptions (that's the "cheating" mode from
// prior sessions).
// CASES_DIR resolved lazily inside the helper since ROOT is defined later
// in the file — we only need the path at call time, not at module load.
function getCasesDir() {
  return path.join(path.resolve(fileURLToPath(import.meta.url), '..', '..', '..'), 'e2e', 'cases');
}

function extractTcodeGuess(title, assertion) {
  const hay = `${title} ${assertion}`.toUpperCase();
  const m = hay.match(/\b([A-Z]{2,4}\d{2,3}|VA\d\d|VF\d\d|SE\d\d|FB\d\d|F-\d\d|FAGL[A-Z0-9]{3})\b/);
  return m ? m[1] : null;
}

function tokenize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function tokenOverlapScore(a, b) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let hits = 0;
  for (const t of a) if (setB.has(t)) hits += 1;
  return hits;
}

async function writeReferenceSkeletonFor(pendingDir, title, assertion, excludeIds = []) {
  try {
    const casesDir = getCasesDir();
    const files = await fsp.readdir(casesDir).catch(() => []);
    const jsons = files.filter((f) => /\.json$/.test(f));
    if (!jsons.length) return null;

    const tcodeGuess = extractTcodeGuess(title, assertion);
    const titleTokens = tokenize(title);
    const exclude = new Set((excludeIds || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean));

    const scored = [];
    for (const f of jsons) {
      const id = f.replace(/\.json$/, '');
      if (exclude.has(id.toLowerCase())) continue;   // Skip user-excluded refs (A/B control)
      const p = path.join(casesDir, f);
      try {
        const obj = JSON.parse(await fsp.readFile(p, 'utf8'));
        const cTitle = String(obj.title || '');
        const cTcode = String(obj.transactionCode || '').toUpperCase();
        let score = 0;
        if (tcodeGuess && cTcode === tcodeGuess) score += 5;
        score += tokenOverlapScore(titleTokens, tokenize(cTitle));
        const steps = obj?.apiGuide?.steps || [];
        if (steps.length < 3) continue;
        scored.push({ id: f.replace(/\.json$/, ''), tcode: cTcode, title: cTitle, score, steps });
      } catch { /* skip */ }
    }
    if (!scored.length) return null;
    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    if (top.score < 1) return null;  // no useful match

    // Structural template — API sequence + count, NO locator text.
    const apiSeq = top.steps.map((s, i) => {
      const api = String(s.midsceneApi || 'agent.aiTap()').replace(/\(\)$/, '');
      return `${i + 1}. ${api}`;
    }).join('\n');

    const md = [
      `# Reference skeleton (structural template only)`,
      ``,
      `Most similar historical case: \`${top.id}\` (T-code ${top.tcode || 'n/a'} · score ${top.score})`,
      ``,
      `**Only the API sequence is copied over — locator text is NOT reproduced here on purpose.** Use this to keep step count + split granularity aligned with a case that already passes, but write locators from what you actually see in the video frames.`,
      ``,
      `## API sequence (${top.steps.length} steps)`,
      ``,
      apiSeq,
      ``,
    ].join('\n');
    await fsp.writeFile(path.join(pendingDir, 'reference-skeleton.md'), md, 'utf8');
    return { refId: top.id, refSteps: top.steps.length, score: top.score };
  } catch (e) {
    console.warn('[video-to-case] reference-case similarity failed:', e.message);
    return null;
  }
}

// Scan done/ folder for a case whose source_video_sha matches. Case JSONs
// carry `source.videoSha` — we set it below when writing case.json. On a
// hit we return the id (folder name); caller responds with cache-hit.
async function findCachedByVideoSha(videoSha) {
  const entries = await fsp.readdir(DONE_DIR).catch(() => []);
  for (const id of entries) {
    const casePath = path.join(DONE_DIR, id, 'case.json');
    try {
      const raw = await fsp.readFile(casePath, 'utf8');
      const obj = JSON.parse(raw);
      if (obj?.source?.videoSha === videoSha) return id;
    } catch { /* not a valid case, skip */ }
  }
  return null;
}

// Warm the KB vector index at module load so the first video upload
// doesn't pay the disk-read + normalize cost. Non-fatal — retrieve()
// itself handles the "index empty" case.
try { refreshIndex(); } catch { /* fine */ }

const router = express.Router();

// Enqueue = accept raw video body + metadata in query, save to disk.
router.post(
  '/',
  express.raw({ type: ['video/*', 'application/octet-stream'], limit: '80mb' }),
  requireAuth(),
  requirePermission('agent:use'),
  async (req, res) => {
    const buf = Buffer.isBuffer(req.body) ? req.body : null;
    if (!buf || buf.length < 1024) {
      return res.status(400).json({ error: 'video body missing or too small' });
    }
    const title     = String(req.query.title     || '').trim().slice(0, 200);
    const assertion = String(req.query.assertion || '').trim().slice(0, 800);
    const filename  = String(req.query.filename  || 'video.mp4').replace(/[^\w.\-]/g, '_').slice(0, 80);
    // excludeRef=id1,id2 — reference-skeleton scan will skip these ids.
    // Used for A/B experiments: when transforming saptest9 as a control,
    // pass ?excludeRef=saptest9 so the retriever can't just find and
    // copy from the "answer".
    const excludeRef = String(req.query.excludeRef || '')
      .split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);
    if (!title || title.length < 3)         return res.status(400).json({ error: 'title required' });
    if (!assertion || assertion.length < 5) return res.status(400).json({ error: 'assertion required' });

    // Video hash cache — if the exact same bytes were converted before,
    // skip re-extraction + re-conversion and hand back the previous case.
    // Match key is content-only (sha256 of the video buffer), so the same
    // clip uploaded under a different title still hits the cache. If you
    // want to force a fresh run, pass ?nocache=1.
    const videoSha = crypto.createHash('sha256').update(buf).digest('hex');
    if (String(req.query.nocache || '') !== '1') {
      const cachedId = await findCachedByVideoSha(videoSha).catch(() => null);
      if (cachedId) {
        await audit(req, 'case-agent.video-to-case.cache-hit', { videoSha, cachedId, title });
        return res.json({
          ok: true,
          id: cachedId,
          cached: true,
          message: '同一视频已转换过，直接返回上次结果',
          videoSha,
        });
      }
    }

    const id = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
             + '-' + crypto.randomBytes(3).toString('hex');
    const dir = path.join(PENDING_DIR, id);
    await fsp.mkdir(dir, { recursive: true });
    const videoPath = path.join(dir, filename);
    await fsp.writeFile(videoPath, buf);

    // Hybrid extraction: fps=1 baseline + scene-change (threshold 0.15)
    // for fast UI transitions. Total lands ~130-160 frames for a 2-min
    // video; dedupes close pairs (< 0.5s apart) so we don't ship near-
    // identical images to the analyzer.
    const framesDir = path.join(dir, 'frames');
    let framesExtracted = 0;
    let extractStats = null;
    try {
      extractStats = await extractFramesHybrid(videoPath, framesDir);
      framesExtracted = extractStats.total;
    } catch (e) {
      console.warn('[video-to-case] ffmpeg failed on upload:', e.message);
    }

    await fsp.writeFile(
      path.join(dir, 'meta.json'),
      JSON.stringify({
        id, title, assertion, filename,
        bytes: buf.length,
        videoSha,
        framesExtracted,
        extractStats,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user?.username || req.user?.id || 'unknown',
      }, null, 2),
      'utf8',
    );
    // Fire-and-forget: enrich pending/<id>/ with (a) KB hints retrieved
    // from vector search on title + assertion, (b) a structural skeleton
    // pulled from the most similar historical case. The video-to-case
    // converter reads both files if present; missing files degrade
    // gracefully. Non-fatal — user-visible response returns immediately.
    const kbHitsCount     = await writeKbHintsFor(dir, title, assertion);
    const referenceRef    = await writeReferenceSkeletonFor(dir, title, assertion, excludeRef);

    await audit(req, 'case-agent.video-to-case.enqueue', {
      id, title, filename, bytes: buf.length, framesExtracted,
      baseline: extractStats?.baseline, scene: extractStats?.scene,
      kbHitsCount, referenceCase: referenceRef?.refId, excludeRef,
    });
    return res.json({
      ok: true,
      id,
      framesExtracted,
      extractStats,
      kbHitsCount,
      referenceCase: referenceRef?.refId,
      excludeRef: excludeRef.length ? excludeRef : undefined,
      videoSha,
    });
  },
);

// Poll — has Claude Code written the case yet?
router.get('/status/:id', requireAuth(), requirePermission('agent:use'), async (req, res) => {
  const id = String(req.params.id || '').replace(/[^\w-]/g, '');
  if (!id) return res.status(400).json({ error: 'id required' });

  const donePath = path.join(DONE_DIR, id, 'case.json');
  const errPath  = path.join(DONE_DIR, id, 'error.txt');
  const pending  = path.join(PENDING_DIR, id);

  // Done first — Claude wrote a case.json.
  if (await fsp.access(donePath).then(() => true).catch(() => false)) {
    try {
      const raw = await fsp.readFile(donePath, 'utf8');
      const caseObj = JSON.parse(raw);
      let notes = '';
      const notesPath = path.join(DONE_DIR, id, 'log.md');
      if (await fsp.access(notesPath).then(() => true).catch(() => false)) {
        notes = await fsp.readFile(notesPath, 'utf8').catch(() => '');
      }
      return res.json({ status: 'ready', case: caseObj, notes });
    } catch (e) {
      return res.status(500).json({ status: 'error', error: 'case.json unreadable: ' + e.message });
    }
  }
  // Error was recorded.
  if (await fsp.access(errPath).then(() => true).catch(() => false)) {
    const msg = await fsp.readFile(errPath, 'utf8').catch(() => '(no detail)');
    return res.json({ status: 'error', error: msg.slice(0, 1000) });
  }
  // Still in queue.
  if (await fsp.access(pending).then(() => true).catch(() => false)) {
    const metaPath = path.join(pending, 'meta.json');
    let meta = null;
    try { meta = JSON.parse(await fsp.readFile(metaPath, 'utf8')); } catch { /* fine */ }
    return res.json({ status: 'pending', meta });
  }
  return res.status(404).json({ status: 'unknown', error: 'no queue entry with this id' });
});

// List pending queue — convenience for Claude Code to know what to process.
router.get('/queue', requireAuth(), requirePermission('agent:use'), async (_req, res) => {
  try {
    const entries = await fsp.readdir(PENDING_DIR).catch(() => []);
    const items = [];
    for (const id of entries) {
      const metaPath = path.join(PENDING_DIR, id, 'meta.json');
      try {
        const meta = JSON.parse(await fsp.readFile(metaPath, 'utf8'));
        items.push(meta);
      } catch { /* skip malformed */ }
    }
    items.sort((a, b) => (a.uploadedAt || '').localeCompare(b.uploadedAt || ''));
    return res.json({ pending: items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
