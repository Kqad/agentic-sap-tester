// /api/case-agent — Case Studio debug agent (Stage 1 skeleton).
//
// Purpose: take a failing SAP test case + error info, ask the LLM to
// classify the failure and propose ONE minimal fix (as a tool call).
// The frontend shows the proposal, the user approves, and the /apply
// endpoint mutates the case JSON in place. Loop is human-in-the-loop
// for now (Stage 1) — no auto-retry.
//
// Endpoints:
//   POST /api/case-agent/analyze  { caseId, error?, failedStepIdx? }
//     → { explain, hypothesis, confidence, toolCalls, kbHits }
//   POST /api/case-agent/apply    { caseId, toolCall }
//     → { ok, updated, message }

import express from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';
import { retrieve as retrieveKb, refreshIndex } from '../kb/retriever.js';
import { chunkKbDir } from '../kb/chunker.js';
import { reindex } from '../kb/store.js';
import { embedTexts } from '../kb/embedder.js';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const router = express.Router();
router.use(requireAuth(), requirePermission('agent:use'));

// ── KB hot-reload ────────────────────────────────────────────────────
const KB_PATH = path.join(__dirname, '..', 'data', 'case-debug-kb.md');
let KB_TEXT = '';
function loadKb() {
  try {
    KB_TEXT = fs.readFileSync(KB_PATH, 'utf8');
    console.log(`[case-agent] KB loaded · ${KB_TEXT.length} chars`);
  } catch (e) {
    console.warn(`[case-agent] failed to load KB: ${e.message}`);
    KB_TEXT = '(case-debug-kb.md 未加载 — agent 将无法工作)';
  }
}
loadKb();
try { fs.watch(KB_PATH, { persistent: false }, () => setTimeout(loadKb, 50)); }
catch { /* fs.watch unavailable — ignore */ }

// ── Tool allow-list + validators ────────────────────────────────────
const ALLOWED_TOOLS = new Set(['setStepLocator', 'insertSleepAfter', 'changeStepApi']);
const ALLOWED_HYPOTHESES = new Set(['locator', 'timing', 'api-mismatch', 'data', 'permission', 'needs-human']);
const ALLOWED_APIS = new Set([
  'agent.aiTap', 'agent.aiKeyboardPress', 'agent.aiInput',
  'agent.aiScroll', 'agent.aiAssert',
]);
const MAX_SLEEP_MS = 5000;

// ── Case file I/O ────────────────────────────────────────────────────
// Case JSON lives at e2e/cases/<caseId>.json. Path guarded so a malicious
// caseId like "../server/data/users" can't escape the folder.
const ROOT = path.resolve(__dirname, '..', '..');
const CASES_DIR = path.join(ROOT, 'e2e', 'cases');
const REPORT_DIR = path.join(ROOT, 'midscene_run', 'report');

// ── Midscene report parsing ──────────────────────────────────────────
// Reports live at midscene_run/report/<timestamp>-jsrun-<case>-<hash>.html
// and embed run data in <script type="midscene_web_dump">…</script> blocks
// (many of them — one per snapshot event, cumulative). The FINAL block
// has the most complete state; earlier blocks are snapshots-in-progress.
//
// From that we pull:
//   • executions[].name                — the natural-language step
//   • executions[].tasks[].status      — pending / running / finished / …
//   • executions[].tasks[].thought     — what the AI decided (BEFORE it acted)
//   • executions[].tasks[].recorder[]  — screenshots (base64)
// and return the first task that isn't a happy status, plus one screenshot.
function extractMidsceneDumps(html) {
  const re = /<script type="midscene_web_dump"[^>]*>([\s\S]*?)<\/script>/g;
  const dumps = [];
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (!raw.startsWith('{')) continue;
    try { dumps.push(JSON.parse(raw)); } catch { /* skip malformed */ }
  }
  return dumps;
}
// Screenshots live in their OWN <script type="midscene-image" data-id="...">
// tags whose body is the `data:image/…;base64,…` URL directly. The dumps
// only carry a { type: "midscene_screenshot_ref", id: uuid } — we index
// the image scripts by id so tasks can resolve their ref.
function extractScreenshotStore(html) {
  const re = /<script type="midscene-image" data-id="([a-f0-9-]{20,})"[^>]*>([\s\S]*?)<\/script>/g;
  const store = new Map();
  let m;
  while ((m = re.exec(html))) {
    const id = m[1];
    const body = m[2].trim();
    if (body.startsWith('data:image/')) store.set(id, body);
  }
  return store;
}

const HAPPY_STATUSES = new Set(['finished', 'success', 'passed', 'ok', 'done']);
const FAIL_STATUSES = new Set(['failed', 'error', 'timeout', 'aborted', 'cancelled']);

// Merge all executions across the (cumulative) dumps into a single flat
// step list, keeping the most recent status per (executionId, taskId).
function mergeExecutionsFromDumps(dumps) {
  const byExecId = new Map();
  for (const d of dumps) {
    for (const ex of d.executions || []) {
      const existing = byExecId.get(ex.id) || { id: ex.id, name: ex.name, tasks: new Map(), order: byExecId.size };
      for (const t of ex.tasks || []) {
        // Prefer the LATEST task record (highest logTime) so a task that
        // moved from running→failed gets its final status.
        existing.tasks.set(t.taskId, t);
      }
      existing.name = ex.name || existing.name;
      byExecId.set(ex.id, existing);
    }
  }
  return [...byExecId.values()]
    .sort((a, b) => a.order - b.order)
    .map((ex) => ({
      id: ex.id,
      name: ex.name,
      tasks: [...ex.tasks.values()],
    }));
}

// Pull ONE screenshot for a task by resolving the recorder frame's
// screenshot_ref → screenshotStore.
function pickTaskScreenshot(task, store) {
  const recs = task?.recorder || [];
  for (const r of recs) {
    const s = r?.screenshot;
    // New shape (Midscene 1.8+): { type: 'midscene_screenshot_ref', id }
    if (s && typeof s === 'object' && s.id && store?.has(s.id)) {
      return store.get(s.id);
    }
    // Older shapes — direct dataURL / raw base64 on the recorder.
    if (typeof s === 'string') {
      if (s.startsWith('data:image/')) return s;
      if (s.length > 200) return `data:image/jpeg;base64,${s}`;
    }
    if (typeof s?.base64 === 'string' && s.base64.length > 200) {
      return `data:image/${s.mimeType?.split('/')?.pop() || 'jpeg'};base64,${s.base64}`;
    }
  }
  return null;
}

// Turn a report file into a compact struct the LLM can reason about.
// Returns null when we can't find the report or it has no failure signal.
function summariseReport(reportPath, opts = {}) {
  let html;
  try { html = fs.readFileSync(reportPath, 'utf8'); }
  catch { return null; }
  const dumps = extractMidsceneDumps(html);
  if (!dumps.length) return null;
  const executions = mergeExecutionsFromDumps(dumps);
  if (!executions.length) return null;
  const screenshotStore = extractScreenshotStore(html);

  // Flatten so each step is (idx, execName, task). idx = sequential across
  // the whole run — matches what the user sees in the log.
  const flat = [];
  for (const ex of executions) {
    for (const t of ex.tasks) {
      flat.push({ execName: ex.name, task: t });
    }
  }
  // First non-happy task = first thing to look at. Fall back to the last
  // task if everything looks "finished" (rare — case still marked fail).
  let firstBad = flat.findIndex(({ task }) =>
    task.status && !HAPPY_STATUSES.has(String(task.status).toLowerCase())
  );
  if (firstBad === -1) firstBad = flat.length - 1;
  const failing = flat[firstBad] || null;
  const lastGood = firstBad > 0 ? flat[firstBad - 1] : null;

  // Timeline slice — last N steps around the failure so the LLM sees
  // the immediate progression, not the whole 150-step trace.
  const N = opts.contextBefore ?? 4;
  const timelineStart = Math.max(0, firstBad - N);
  const timelineEnd = Math.min(flat.length - 1, firstBad + 1);
  const timeline = flat.slice(timelineStart, timelineEnd + 1).map((row, i) => ({
    idx: timelineStart + i,
    execName: row.execName,
    status: row.task.status,
    type: row.task.type,
    subType: row.task.subType,
    prompt: row.task.param?.prompt || row.task.param?.value || '',
    thought: row.task.thought || '',
    isFailing: (timelineStart + i) === firstBad,
  }));

  // Screenshot resolution: prefer the failing task's own screenshot.
  // Fall back to the LAST screenshot from any preceding task — for
  // Assert / Planning tasks that don't take their own screenshot, the
  // most recent one still represents the page state at failure time.
  let screenshot = failing ? pickTaskScreenshot(failing.task, screenshotStore) : null;
  if (!screenshot) {
    for (let i = firstBad - 1; i >= 0; i -= 1) {
      const s = pickTaskScreenshot(flat[i].task, screenshotStore);
      if (s) { screenshot = s; break; }
    }
  }

  return {
    reportPath: path.basename(reportPath),
    totalSteps: flat.length,
    failingIdx: firstBad,
    failingExec: failing?.execName || '',
    failingType: failing?.task?.type || '',
    failingSubType: failing?.task?.subType || '',
    failingStatus: failing?.task?.status || '',
    failingThought: failing?.task?.thought || '',
    failingParam: failing?.task?.param || null,
    lastGoodExec: lastGood?.execName || '',
    timeline,
    screenshot, // data:image/...;base64,... or null
  };
}

function reportPathFromUrl(reportUrl) {
  // Client passes something like "/reports/2026-07-01T...-jsrun-saptest2-....html"
  // Extract just the filename and resolve inside REPORT_DIR — path guard.
  const clean = String(reportUrl || '').trim();
  const name = clean.split(/[?#]/)[0].split('/').pop() || '';
  if (!/^[a-zA-Z0-9._-]{5,200}\.html$/.test(name)) return null;
  const full = path.join(REPORT_DIR, name);
  if (!full.startsWith(REPORT_DIR + path.sep) && full !== REPORT_DIR) return null;
  return full;
}

function caseJsonPath(caseId) {
  const clean = String(caseId || '').trim();
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(clean)) throw new Error(`invalid caseId: ${caseId}`);
  return path.join(CASES_DIR, clean + '.json');
}
async function readCaseJson(caseId) {
  const p = caseJsonPath(caseId);
  const text = await fsp.readFile(p, 'utf8');
  return { path: p, data: JSON.parse(text) };
}
async function writeCaseJson(p, data) {
  const pretty = JSON.stringify(data, null, 2);
  await fsp.writeFile(p, pretty, 'utf8');
}

// ── Sanitise the LLM output ─────────────────────────────────────────
// The prompt asks for `{explain, hypothesis, confidence, toolCalls}`
// but the model can drift — clip everything to shapes the /apply
// endpoint knows how to execute.
function sanitizeAnalysis(raw, caseData) {
  const steps = caseData?.apiGuide?.steps || [];
  const maxIdx = steps.length - 1;
  const out = {
    explain: '',
    hypothesis: 'needs-human',
    confidence: 0,
    toolCalls: [],
  };
  if (!raw || typeof raw !== 'object') return out;

  out.explain = String(raw.explain || '').trim().slice(0, 300);
  if (ALLOWED_HYPOTHESES.has(raw.hypothesis)) out.hypothesis = raw.hypothesis;
  const cf = Number(raw.confidence);
  if (Number.isFinite(cf)) out.confidence = Math.max(0, Math.min(1, cf));

  const calls = Array.isArray(raw.toolCalls) ? raw.toolCalls : [];
  // Stage 1: enforce "0 or 1" — one fix per iteration.
  for (const call of calls.slice(0, 1)) {
    if (!call || typeof call !== 'object') continue;
    const tool = String(call.tool || '');
    if (!ALLOWED_TOOLS.has(tool)) continue;
    const args = (call.args && typeof call.args === 'object') ? call.args : {};

    if (tool === 'setStepLocator') {
      const stepIdx = Number(args.stepIdx);
      const newLocator = String(args.newLocator || '').trim();
      if (!Number.isInteger(stepIdx) || stepIdx < 0 || stepIdx > maxIdx) continue;
      if (!newLocator || newLocator.length > 200) continue;
      out.toolCalls.push({
        tool,
        args: {
          stepIdx,
          newLocator,
          reason: String(args.reason || '').slice(0, 200),
        },
      });
    } else if (tool === 'insertSleepAfter') {
      const afterStepIdx = Number(args.afterStepIdx);
      const ms = Math.max(200, Math.min(MAX_SLEEP_MS, Number(args.ms) || 1500));
      if (!Number.isInteger(afterStepIdx) || afterStepIdx < 0 || afterStepIdx > maxIdx) continue;
      out.toolCalls.push({
        tool,
        args: {
          afterStepIdx, ms,
          reason: String(args.reason || '').slice(0, 200),
        },
      });
    } else if (tool === 'changeStepApi') {
      const stepIdx = Number(args.stepIdx);
      const newApi = String(args.newApi || '').trim();
      const newArg = String(args.newArg || '').trim();
      if (!Number.isInteger(stepIdx) || stepIdx < 0 || stepIdx > maxIdx) continue;
      if (!ALLOWED_APIS.has(newApi)) continue;
      out.toolCalls.push({
        tool,
        args: {
          stepIdx, newApi, newArg,
          reason: String(args.reason || '').slice(0, 200),
        },
      });
    }
  }
  return out;
}

// ── Trim the step slice we send the LLM ─────────────────────────────
// Instead of shipping the whole 25-step apiGuide, ship the failing
// step + 2 neighbours on each side. Keeps prompts small and lets the
// model see WHY the transition matters.
function stepSliceForPrompt(caseData, failedStepIdx) {
  const steps = caseData?.apiGuide?.steps || [];
  if (!steps.length) return { slice: [], meta: null };
  const idx = Number.isInteger(failedStepIdx)
    ? Math.max(0, Math.min(steps.length - 1, failedStepIdx))
    : steps.length - 1;
  const lo = Math.max(0, idx - 2);
  const hi = Math.min(steps.length - 1, idx + 2);
  const slice = [];
  for (let i = lo; i <= hi; i += 1) {
    const s = steps[i];
    slice.push({
      idx: i,
      order: s.order,
      isFailed: i === idx,
      api: s.midsceneApi,
      instruction: s.naturalLanguageInstruction || s.title || '',
      exampleCode: s.exampleCode || '',
    });
  }
  return {
    slice,
    meta: {
      title: caseData.title,
      transactionCode: caseData.transactionCode,
      failedIdx: idx,
      totalSteps: steps.length,
    },
  };
}

// ── /api/case-agent/analyze ─────────────────────────────────────────
router.post('/analyze', async (req, res) => {
  const { caseId, error: errorMsg, failedStepIdx, reportUrl } = req.body || {};
  if (!caseId) return res.status(400).json({ error: 'caseId is required' });

  let caseFile;
  try { caseFile = await readCaseJson(caseId); }
  catch (e) { return res.status(404).json({ error: `case not found: ${e.message}` }); }

  const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL;
  const apiKey  = process.env.MIDSCENE_MODEL_API_KEY;
  const modelName = process.env.MIDSCENE_MODEL_NAME;
  if (!baseUrl || !apiKey || !modelName) {
    return res.status(503).json({
      error: 'AI model not configured — MIDSCENE_MODEL_BASE_URL / _API_KEY / _NAME',
    });
  }

  // ── Load report summary if the client shared a URL ──────────────
  // The report tells us: which step actually failed (from Midscene's own
  // task graph, not just log line matching), what the AI was THINKING
  // when it acted (thought), and gives us a screenshot for the vision
  // model to look at. Without this the LLM is guessing.
  let reportSummary = null;
  if (reportUrl) {
    const p = reportPathFromUrl(reportUrl);
    if (p) reportSummary = summariseReport(p);
  }
  // If the report identified the failing step and the client didn't
  // pass one explicitly, use the report's version.
  const resolvedFailedIdx = Number.isInteger(failedStepIdx)
    ? failedStepIdx
    : (reportSummary?.failingIdx ?? null);

  const { slice, meta } = stepSliceForPrompt(caseFile.data, resolvedFailedIdx);
  const timelineBlock = reportSummary?.timeline?.length
    ? `\n\n从 Midscene report 抽出的时间线（跨 Locate / Action / Assert 的实际执行 task）：\n`
      + reportSummary.timeline.map((t) =>
          `  ${t.isFailing ? '→ 失败 ' : '  ok    '}[trace-idx=${t.idx}] `
          + `[status=${t.status}] ${t.type}/${t.subType} · `
          + `${t.execName || '(no name)'}`
          + (t.prompt ? `  · prompt="${String(t.prompt).slice(0, 80)}"` : '')
          + (t.thought ? `\n         thought: "${String(t.thought).slice(0, 240)}"` : ''),
        ).join('\n')
    : '';
  // ── RAG: pull relevant KB chunks before we prompt the LLM ──────
  // Query = failing step's instruction + thought + first slice of error.
  // Metadata filter is loose (any of the failing-subtask type tags) so
  // dense embedding gets the biggest say. Failures here are non-fatal —
  // we drop the retrieval block and continue with just the KB in the
  // system prompt (the LLM planner still works).
  let kbHits = [];
  try {
    const failingSubType = reportSummary?.failingSubType || '';
    const hintTag = /Locate/i.test(failingSubType) ? 'locator'
                  : /Tap|Action/i.test(failingSubType) ? 'api-mismatch'
                  : /Query/i.test(failingSubType) ? 'timing'
                  : /Assert/i.test(failingSubType) ? 'assert'
                  : null;
    const failingStep = slice.find((s) => s.isFailed);
    const query = [
      failingStep?.instruction || '',
      errorMsg ? String(errorMsg).slice(0, 400) : '',
      reportSummary?.failingThought?.slice(0, 300) || '',
    ].filter(Boolean).join(' · ');
    if (query.trim()) {
      const r = await retrieveKb(query, {
        k: 4,
        hypothesis: hintTag,
      });
      kbHits = r.hits || [];
    }
  } catch (e) {
    console.warn('[case-agent] RAG retrieve failed:', e.message);
  }
  const ragBlock = kbHits.length
    ? '\n\n📚 KB 检索命中（按相关度）:\n'
      + kbHits.map((h, i) =>
          `【${i + 1}】${h.relPath} · ${h.section} · score=${h.score}\n${h.text}`,
        ).join('\n\n---\n')
    : '';

  const contextBlock = `当前 debug 上下文：

case: ${meta.title} · T-code ${meta.transactionCode}
失败步骤 index: ${meta.failedIdx} (order #${slice.find((s) => s.isFailed)?.order}) · 共 ${meta.totalSteps} 步

错误信息:
${errorMsg ? String(errorMsg).slice(0, 1500) : '(用户没提供错误信息)'}

失败步骤 + 周围步骤（stepIdx 是数组下标，从 0 开始 — 就是 tool 里要传的那个 stepIdx）:
${slice.map((s) => `  ${s.isFailed ? '→ ' : '  '}[idx=${s.idx}] order #${s.order} · ${s.api} · ${s.instruction}`).join('\n')}`
    + timelineBlock
    + (reportSummary?.failingThought
        ? `\n\n失败那一步的 AI 内心独白 (thought)：\n"${reportSummary.failingThought.slice(0, 500)}"`
        : '')
    + (reportSummary?.screenshot
        ? '\n\n附了一张截图 (失败步的页面状态) — 请结合视觉分析。'
        : '')
    + ragBlock;

  // Vision content block — Qwen-VL takes { type: "image_url", image_url: {…} }
  // alongside text parts. Screenshot is optional; when absent we send text
  // only and the model reasons on text alone (worse but works).
  const userContent = reportSummary?.screenshot
    ? [
        { type: 'text',      text: contextBlock },
        { type: 'image_url', image_url: { url: reportSummary.screenshot } },
      ]
    : contextBlock;

  await audit(req, 'case-agent.analyze', {
    caseId,
    failedStepIdx: meta.failedIdx,
    hasReport: !!reportSummary,
    hasScreenshot: !!reportSummary?.screenshot,
    kbHitsCount: kbHits.length,
    model: modelName,
  });

  let resp;
  try {
    resp = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: KB_TEXT },
          { role: 'user',   content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
    });
  } catch (e) {
    return res.status(502).json({ error: 'model request failed', detail: e.message });
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return res.status(resp.status).json({
      error: `model returned ${resp.status}`,
      detail: text.slice(0, 600),
    });
  }
  const body = await resp.json().catch(() => null);
  const reply = body?.choices?.[0]?.message?.content;
  if (!reply) return res.status(502).json({ error: 'model returned no content' });

  const stripped = reply.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();
  let parsed;
  try { parsed = JSON.parse(stripped); }
  catch (e) {
    return res.status(502).json({
      error: 'model returned invalid JSON',
      detail: stripped.slice(0, 400),
    });
  }
  const analysis = sanitizeAnalysis(parsed, caseFile.data);
  // Also echo the report evidence back so the client can show "AI 看到了
  // 这些证据 →" panels. Screenshots are dropped from the echo (big
  // payload, client already has the report URL to open in a tab).
  const evidence = reportSummary ? {
    reportPath: reportSummary.reportPath,
    failingIdx: reportSummary.failingIdx,
    failingExec: reportSummary.failingExec,
    failingType: reportSummary.failingType,
    failingSubType: reportSummary.failingSubType,
    failingStatus: reportSummary.failingStatus,
    failingThought: reportSummary.failingThought.slice(0, 800),
    lastGoodExec: reportSummary.lastGoodExec,
    timeline: reportSummary.timeline.map(({ ...t }) => t),
    hadScreenshot: !!reportSummary.screenshot,
  } : null;
  // Trim retrieved chunks for the client — full text can be big, and the
  // client just wants "which chunks did we look at" for the evidence panel.
  const kbEvidence = kbHits.map((h) => ({
    relPath: h.relPath,
    section: h.section,
    score: h.score,
    tags: h.tags,
    preview: String(h.text || '').slice(0, 180),
  }));
  return res.json({ ...analysis, evidence, kbHits: kbEvidence });
});

// ── /api/case-agent/apply ───────────────────────────────────────────
// Applies exactly ONE proposed tool call to the case JSON on disk.
// Writes a `.bak` beside the file on first apply per session so a bad
// LLM fix can be rolled back without git.
router.post('/apply', async (req, res) => {
  const { caseId, toolCall } = req.body || {};
  if (!caseId || !toolCall) return res.status(400).json({ error: 'caseId + toolCall required' });
  if (!ALLOWED_TOOLS.has(toolCall.tool)) {
    return res.status(400).json({ error: `unknown tool: ${toolCall.tool}` });
  }

  let caseFile;
  try { caseFile = await readCaseJson(caseId); }
  catch (e) { return res.status(404).json({ error: `case not found: ${e.message}` }); }

  const backupPath = caseFile.path + '.bak';
  if (!await fsp.access(backupPath).then(() => true).catch(() => false)) {
    await fsp.copyFile(caseFile.path, backupPath);
  }

  const data = caseFile.data;
  const steps = data.apiGuide?.steps;
  if (!Array.isArray(steps)) return res.status(400).json({ error: 'case has no apiGuide.steps' });

  const { tool, args } = toolCall;
  let summary = '';
  try {
    if (tool === 'setStepLocator') {
      const step = steps[args.stepIdx];
      if (!step) throw new Error('stepIdx out of range');
      const original = step.naturalLanguageInstruction || step.title || '';
      step.naturalLanguageInstruction = args.newLocator;
      step.title = args.newLocator;
      // Best-effort exampleCode rewrite — replace old locator string in
      // "await agent.aiXxx("<old>", ...)" pattern. If we can't safely
      // find it, leave exampleCode alone (runner reads NLI anyway).
      if (typeof step.exampleCode === 'string') {
        step.exampleCode = step.exampleCode.replace(
          /(agent\.\w+\(\s*)(['"`])([\s\S]*?)\2/,
          (m, prefix, q) => `${prefix}${q}${args.newLocator.replace(/["\\]/g, '\\$&')}${q}`,
        );
      }
      summary = `step[${args.stepIdx}] locator: "${original}" → "${args.newLocator}"`;
    } else if (tool === 'insertSleepAfter') {
      const anchor = steps[args.afterStepIdx];
      if (!anchor) throw new Error('afterStepIdx out of range');
      const insertOrder = (Number(anchor.order) || 0) + 0.5; // temp; resequence below
      steps.splice(args.afterStepIdx + 1, 0, {
        order: insertOrder,
        title: `等待 ${args.ms}ms`,
        // Use exactly the shape runner's dispatchStep fast-path recognises
        // (`await sleep(N)`) so the wait shows up in the console log AND
        // as a card in the Midscene report timeline. Other shapes work via
        // AsyncFunction eval but are silent.
        midsceneApi: 'sleep',
        naturalLanguageInstruction: `等待 ${args.ms}ms（自动加的等待，让页面稳一下）`,
        reason: args.reason || 'wait for page to settle',
        exampleCode: `await sleep(${args.ms});`,
      });
      // Resequence orders: 1..N
      steps.forEach((s, i) => { s.order = i + 1; });
      summary = `已在 step[${args.afterStepIdx}] 后插入 sleep(${args.ms}ms)`;
    } else if (tool === 'changeStepApi') {
      const step = steps[args.stepIdx];
      if (!step) throw new Error('stepIdx out of range');
      const originalApi = step.midsceneApi;
      step.midsceneApi = args.newApi + '()';
      // Rewrite exampleCode — the runner sometimes reads it directly.
      const shortApi = args.newApi.replace(/^agent\./, 'agent.');
      const arg = String(args.newArg || '').replace(/["\\]/g, '\\$&');
      if (typeof step.exampleCode === 'string' && arg) {
        step.exampleCode = `await ${shortApi}("${arg}");`;
      }
      summary = `step[${args.stepIdx}] api: ${originalApi} → ${args.newApi}(${args.newArg || ''})`;
    }
    // ── Keep top-level naturalLanguage + jsSource in sync ────────
    // The runner reads apiGuide.steps[] (single source of truth for
    // execution). But the NL panel shows caseData.naturalLanguage and
    // the JS panel shows caseData.jsSource — if we don't refresh
    // those the user sees stale text and thinks Apply didn't work.
    resyncTopLevelText(data);
    await writeCaseJson(caseFile.path, data);
  } catch (e) {
    return res.status(400).json({ error: 'apply failed', detail: e.message });
  }
  await audit(req, 'case-agent.apply', { caseId, tool, summary });
  return res.json({ ok: true, summary, backup: path.basename(backupPath) });
});

// Regenerate caseData.naturalLanguage and caseData.jsSource from the
// current apiGuide.steps[]. The regen format is deliberately simple —
// "1. instruction\n2. instruction" and a plain `async function run(agent)`
// wrapper. Preserving the original block grouping isn't worth the
// bookkeeping (users rarely round-trip these fields; the runner
// doesn't consume either of them).
function resyncTopLevelText(data) {
  const steps = data?.apiGuide?.steps || [];
  if (!steps.length) return;
  // Natural language — 1 step per line, numbered.
  data.naturalLanguage = steps
    .map((s, i) => {
      const text = String(s.naturalLanguageInstruction || s.title || '').trim();
      return `${i + 1}. ${text}`;
    })
    .join('\n');
  // JS source — reconstitute exampleCode (or a sleep fallback) per line.
  // Keep the shape the desktop tool originally produced so any downstream
  // reader that greps for `await agent.aiX(` still works.
  const body = steps.map((s) => {
    const code = String(s.exampleCode || '').trim();
    if (code) return '  ' + code;
    if (String(s.midsceneApi || '').toLowerCase().startsWith('sleep')) {
      // Fallback for inserted sleep steps missing exampleCode.
      const m = /(\d+)\s*ms/.exec(String(s.title || s.naturalLanguageInstruction || ''));
      return `  await new Promise((r) => setTimeout(r, ${m ? m[1] : 1000}));`;
    }
    return '  // (no exampleCode)';
  }).join('\n');
  data.jsSource = `async function run(agent) {\n${body}\n}`;
}

// ── /api/case-agent/postmortem ───────────────────────────────────────
// Record whether a proposed fix actually worked, then write it into
// server/data/kb/postmortems/ and trigger an incremental reindex so
// next time a similar failure comes up, retrieval can surface this
// exact past attempt.
//
// Body shape:
//   {
//     caseId,
//     toolCall:  { tool, args },   // the fix that was applied
//     worked:    true | false,
//     hypothesis: string,
//     failingSubType?, failingThought?, errorSnippet?, notes?
//   }
const KB_DIR = path.join(ROOT, 'server', 'data', 'kb');
const POSTMORTEMS_DIR = path.join(KB_DIR, 'postmortems');

// Deterministic signature — same (caseId, step, tool, keyArgs) always
// hashes the same. Lets us dedup repeat attempts and update in place.
function fixSignature({ caseId, toolCall }) {
  const args = toolCall?.args || {};
  const key = [
    caseId,
    args.stepIdx ?? args.afterStepIdx ?? '?',
    toolCall?.tool || '?',
    // For locator changes we key on the NEW text (that's what varies).
    // For sleep insertions we key on ms bucket (200/1500/3000).
    toolCall?.tool === 'setStepLocator'  ? (args.newLocator || '') :
    toolCall?.tool === 'insertSleepAfter' ? `sleep-${Math.round((args.ms || 0) / 500) * 500}` :
    toolCall?.tool === 'changeStepApi'    ? `${args.newApi}::${args.newArg || ''}` : '',
  ].join('::');
  return crypto.createHash('sha1').update(key).digest('hex').slice(0, 12);
}

function slugify(s) {
  return String(s || '').toLowerCase()
    .replace(/[一-龥]+/g, (m) => m)         // keep CJK
    .replace(/[^\w一-龥-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function renderPostmortemMd(entry) {
  const { caseId, toolCall, worked, hypothesis, failingSubType, failingThought,
          errorSnippet, notes, signature, when } = entry;
  const args = toolCall?.args || {};
  const tagList = [
    hypothesis,
    toolCall?.tool,
    caseId,
    worked ? 'verified' : 'attempted-failed',
  ].filter(Boolean);
  const frontmatter = [
    '---',
    `tags: [${tagList.map((t) => `"${t}"`).join(', ')}]`,
    'scope: postmortem',
    `tool: ${toolCall?.tool || 'none'}`,
    `caseId: ${caseId}`,
    `signature: ${signature}`,
    `worked: ${worked}`,
    `addedAt: ${when}`,
    '---',
    '',
  ].join('\n');

  const fixDetail = (() => {
    if (toolCall?.tool === 'setStepLocator') {
      return `- **stepIdx**: ${args.stepIdx}\n- **新 locator**: \`${args.newLocator}\`${args.reason ? '\n- **理由**: ' + args.reason : ''}`;
    }
    if (toolCall?.tool === 'insertSleepAfter') {
      return `- **afterStepIdx**: ${args.afterStepIdx}\n- **sleep**: \`${args.ms}ms\`${args.reason ? '\n- **理由**: ' + args.reason : ''}`;
    }
    if (toolCall?.tool === 'changeStepApi') {
      return `- **stepIdx**: ${args.stepIdx}\n- **改成**: \`${args.newApi}("${args.newArg || ''}")\`${args.reason ? '\n- **理由**: ' + args.reason : ''}`;
    }
    return JSON.stringify(args, null, 2);
  })();

  const title = worked
    ? `${caseId} · ${toolCall?.tool} @ step ${args.stepIdx ?? args.afterStepIdx ?? '?'} · ✓ 已验证`
    : `${caseId} · ${toolCall?.tool} @ step ${args.stepIdx ?? args.afterStepIdx ?? '?'} · ✗ 试过没效`;

  return frontmatter + [
    `# ${title}`,
    '',
    '## 症状',
    `- **hypothesis**: \`${hypothesis || 'unknown'}\``,
    failingSubType ? `- **Midscene sub-task**: \`${failingSubType}\`` : '',
    failingThought ? `- **AI thought**: "${failingThought.slice(0, 400).replace(/"/g, '\\"')}"` : '',
    errorSnippet   ? `- **Error**: \`${errorSnippet.slice(0, 240).replace(/`/g, "'")}\`` : '',
    '',
    '## 修法',
    fixDetail,
    '',
    '## 结果',
    worked
      ? '- ✓ **有效** — 用户点了「有效」按钮确认。未来遇到相似 signature 的失败，可以优先复用这条修法。'
      : '- ✗ **无效** — 用户点了「无效」按钮。未来 planner 遇到相同 signature 时**不要重复这个 fix**，换别的假设。',
    notes ? `\n**备注**: ${notes}` : '',
  ].filter((l) => l !== undefined && l !== '').join('\n');
}

router.post('/postmortem', async (req, res) => {
  const { caseId, toolCall, worked, hypothesis, failingSubType, failingThought,
          errorSnippet, notes } = req.body || {};
  if (!caseId || !toolCall || typeof worked !== 'boolean') {
    return res.status(400).json({ error: 'caseId, toolCall, worked (bool) required' });
  }
  if (!ALLOWED_TOOLS.has(toolCall.tool)) {
    return res.status(400).json({ error: `unknown tool: ${toolCall.tool}` });
  }

  await fsp.mkdir(POSTMORTEMS_DIR, { recursive: true });
  const signature = fixSignature({ caseId, toolCall });
  const when = new Date().toISOString().slice(0, 10);
  const slug = slugify(`${caseId}-${toolCall.tool}-${(toolCall.args?.newLocator || toolCall.args?.newApi || 'sleep')}`);
  // File name is stable per signature — replaying (worked / not-worked)
  // updates the same file rather than creating dupes.
  const filename = `${when}-${signature}-${slug}.md`;
  const target = path.join(POSTMORTEMS_DIR, filename);

  // Look for existing file with the same signature (any date prefix) so
  // repeated attempts don't multiply files.
  let existing = null;
  try {
    for (const f of await fsp.readdir(POSTMORTEMS_DIR)) {
      if (f.includes(signature)) { existing = path.join(POSTMORTEMS_DIR, f); break; }
    }
  } catch { /* dir just created — fine */ }
  const finalPath = existing || target;

  const md = renderPostmortemMd({
    caseId, toolCall, worked, hypothesis,
    failingSubType, failingThought, errorSnippet, notes,
    signature, when,
  });
  await fsp.writeFile(finalPath, md, 'utf8');

  // Trigger an incremental reindex — only the new/changed chunk gets a
  // real embed call. Existing chunks are reused by SHA.
  let reindexed = 0;
  try {
    const chunks = chunkKbDir(KB_DIR);
    const idx = await reindex(chunks, embedTexts, {
      log: (m) => console.log('[postmortem]', m),
    });
    refreshIndex();
    reindexed = idx.chunks.length;
  } catch (e) {
    console.warn('[postmortem] reindex failed (non-fatal):', e.message);
  }

  await audit(req, 'case-agent.postmortem', {
    caseId, worked, tool: toolCall.tool, signature,
    file: path.basename(finalPath),
    replaced: !!existing,
  });
  return res.json({
    ok: true,
    signature,
    file: path.basename(finalPath),
    action: existing ? 'updated' : 'created',
    reindexedChunks: reindexed,
  });
});

export default router;
