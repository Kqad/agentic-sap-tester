// In-process Midscene JS runner using Playwright. Dispatches each apiGuide
// step through a per-API dispatcher so we can:
//   - capture aiQuery return values into a per-run variables Map
//   - intercept aiAssert for local A == B comparisons (vs delegating to AI)
//   - intercept aiAssert for "download success" style checks (polls Downloads)
//   - wrap each step in retry + scroll-recovery + aiAct-replan fallback
//
// Source of truth:
//   - per-API dispatch ↔ executeApiGuideStep() in Desktop midscene.ts
//   - recovery cascade ↔ executeApiGuideStepWithRecovery() in Desktop
// Both ported with the heavy "download / variable / scroll" code factored
// out into ./helpers ./variables ./downloads ./recovery.

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  buildJavascriptCacheId,
  hasUsableCache,
  resolveCachePath,
  autoMigrateCacheFromLatestPassedRun,
} from './cache-id.js';
import { stripScrollCacheEntries, stripCacheEntriesByPrompt } from './cache-scrub.js';
import { configureLlmProxy } from './llm-proxy.js';
import {
  registerActiveRun,
  unregisterActiveRun,
  setActiveRunStep,
  appendActiveRunLog,
  attachActiveRunCleanup,
  recordActiveRunScreenshot,
} from './active-runs.js';
import {
  sleep, safeStringify, truncate, withTimeout,
  normalizeApiName, normalizeError,
  delayAfterStepMs, QUERY_PRE_DELAY_MS,
  detectScrollExtreme, SCROLL_DRAG_TIMEOUT_MS, STEP_RETRY_DELAY_MS,
} from './helpers.js';
import { captureQueryVariable, tryLocalComparison } from './variables.js';
import { resolveDynamicInputValue } from './llm.js';
import { isDownloadCheckInstruction, waitForDownloadedFile } from './downloads.js';
import { executeStepWithRecovery } from './recovery.js';
import { ROOT, RUNS_DIR, SCREENSHOTS_DIR } from '../paths.js';

// Capture a JPEG screenshot for the active run and persist it under
// midscene_run/screenshots/<runId>/step-<order>.jpg. Best-effort: any failure
// is logged but doesn't abort the run — this is purely UI ornament.
//
// `cached` is a best-effort signal we surface in the workbench flow view:
//   true  → step's locator was served from Midscene cache (cache hit)
//   false → cache miss, the LLM was called
//   null  → unknown / not applicable (no aiInput/aiTap-style action)
async function captureStepScreenshot(page, runId, step, status, cached) {
  if (!page || page.isClosed?.()) return;
  const dir = path.join(SCREENSHOTS_DIR, runId);
  const file = path.join(dir, `step-${step.order}.jpg`);
  try {
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: file, type: 'jpeg', quality: 60, fullPage: false });
    recordActiveRunScreenshot(runId, { order: step.order, status, cached });
  } catch (e) {
    // Don't let a screenshot failure kill the run.
    appendActiveRunLog(runId, `(screenshot capture failed for step ${step.order}: ${e?.message ?? e})`);
  }
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// Parse `await agent.aiInput("LOCATOR", { value: "VAL" })` out of an apiGuide
// step's exampleCode so the Parameters tab can override VAL per-step without
// touching apiGuide (and therefore without invalidating cacheId — the cache
// key is locator/xpath-based, not value-based).
//
// Returns null if the code doesn't match the expected shape; caller falls
// back to evaling exampleCode verbatim.
function extractAiInputArgs(code) {
  if (!code) return null;
  const m = /aiInput\s*\(\s*(['"`])([\s\S]*?)\1\s*,\s*\{\s*value\s*:\s*(['"`])([\s\S]*?)\3\s*\}\s*\)/.exec(code);
  if (!m) return null;
  return { locator: m[2], value: m[4] };
}

const VIEWPORT = { width: 1920, height: 1080 };
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

// ── Scroll-extreme verify helpers ──────────────────────────────────────
// Ported from Desktop\saptest\src\lib\midscene.ts (captureScrollScreen* +
// llmConfirmScrollProgress). For "滑/拖 + 最X" aiScroll steps we drag once,
// then ask aiBoolean whether anything visibly scrolled. Used to short-circuit
// the runner's retry path so a successful drag doesn't get executed twice.
async function captureScrollScreenBuffer(page) {
  try { return await page.screenshot({ type: 'jpeg', quality: 70 }); }
  catch { return null; }
}

function bufferSha1(buf) {
  return buf ? crypto.createHash('sha1').update(buf).digest('hex') : null;
}

// Drag the scrollbar slider to the viewport extreme by COMPUTING the target
// coordinate from the slider's current position + direction, instead of
// asking the LLM to find both the start AND the end of the scrollbar (which
// it often gets wrong — "滚动条最底端位置" gets misinterpreted as "page
// bottom center" rather than "vertical scrollbar end on right edge").
//
// Only one LLM call: aiLocate to find the SLIDER (which has a distinct
// visual appearance and is easy to locate, plus it's cacheable). The target
// coordinate is pure geometry — same X (vertical drag), Y near viewport edge
// (or vice-versa for horizontal). Drag goes raw through Playwright mouse
// events, no extra LLM planning needed.
async function dragSliderToExtreme(agent, page, direction, log) {
  const isVertical = direction === 'top' || direction === 'bottom';
  // Slider locator phrasing matters for cache reuse — keep stable across
  // runs so the locate cache key matches.
  const sliderPrompt = isVertical
    ? '右侧纵向滚动条的滑块'
    : '底部横向滚动条的滑块';

  let located;
  try {
    located = await agent.aiLocate(sliderPrompt);
  } catch (e) {
    log(`  …slider locate failed: ${e?.message ?? e}`);
    throw e;
  }
  const center = located?.center;
  if (!Array.isArray(center) || center.length < 2) {
    throw new Error(`slider locate returned no center: ${JSON.stringify(located)}`);
  }
  const cx = Math.round(center[0]);
  const cy = Math.round(center[1]);

  const viewport = page.viewportSize() ?? { width: 1920, height: 1080 };
  // Overshoot by MARGIN so the slider clamps at the true extreme.
  const MARGIN = 6;
  let targetX, targetY;
  switch (direction) {
    case 'top':    targetX = cx;                          targetY = MARGIN;                   break;
    case 'bottom': targetX = cx;                          targetY = viewport.height - MARGIN; break;
    case 'left':   targetX = MARGIN;                      targetY = cy;                       break;
    case 'right':  targetX = viewport.width - MARGIN;     targetY = cy;                       break;
    default: throw new Error(`unknown scroll direction: ${direction}`);
  }

  log(`  …slider drag (${direction}): from [${cx},${cy}] → [${targetX},${targetY}]`);
  const t0 = Date.now();
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  // Multi-step move so the drag is recognized; SAP scrollbars sometimes
  // ignore single-step jumps.
  await page.mouse.move(targetX, targetY, { steps: 30 });
  await page.mouse.up();
  const dragMs = Date.now() - t0;

  // Add a card to the Midscene report so the drag shows up in the timeline.
  // page.mouse.* is raw Playwright — it bypasses Midscene's auto-instrumented
  // logging, so without this manual card the replay only shows the slider
  // locate and skips the drag motion + endpoint entirely.
  try {
    await agent.recordToReport?.('Slider drag', {
      content: [
        `direction: ${direction}`,
        `from: [${cx}, ${cy}]  (located via aiLocate "${sliderPrompt}")`,
        `to:   [${targetX}, ${targetY}]  (computed: viewport ${viewport.width}×${viewport.height}, margin ${MARGIN})`,
        `duration: ${dragMs}ms (30 mouse-move steps)`,
      ].join('\n'),
    });
  } catch { /* report attachment is best-effort */ }
}

async function llmConfirmScrollProgress(agent, beforeBase64, label, log) {
  if (typeof agent.aiBoolean !== 'function' || !beforeBase64) return null;
  try {
    const result = await withTimeout(
      agent.aiBoolean({
        prompt:
          '附件中的第一张图是拖动/滚动操作之前的页面截图，请把它和当前页面截图作对比，' +
          '判断页面或表格内容是否发生了明显的滚动位移（包括纵向 = 数据行换了，以及横向 = 表头列换了 / 列名出现的位置移动了）。' +
          '只要表头列发生了横向位移、或者表格里出现了之前看不到的列/行，都算明显滚动 → 返回 true。' +
          '仅 tooltip、动画、loading 提示、光标等无关变化不算明显滚动。' +
          '如果有明显滚动返回 true，否则返回 false。',
        images: [{ name: 'before-scroll', url: `data:image/jpeg;base64,${beforeBase64}` }],
      }),
      SCROLL_DRAG_TIMEOUT_MS,
      `${label} LLM scroll compare`,
    );
    log(`${label} LLM scroll compare = ${Boolean(result)}`);
    return Boolean(result);
  } catch (err) {
    log(`${label} LLM scroll compare failed: ${normalizeError(err)}`);
    return null;
  }
}

// ── Per-API dispatcher ─────────────────────────────────────────────────
// `agent` is a Midscene PlaywrightAgent. `step` is one apiGuide step. `ctx`
// holds the per-run state (variables Map, summary {assertions, downloads},
// log fn). Returns whatever the underlying call returned (aiQuery → value,
// others → undefined). MUST be safe to retry — never persist side effects
// to `variables` / `summary` UNLESS the call actually succeeded.
async function dispatchStep(agent, step, ctx) {
  const instruction = step.naturalLanguageInstruction ?? '';
  const api = normalizeApiName(step);

  // aiAssert: 3 fast paths before falling through to the model.
  if (api === 'aiAssert') {
    // 1) Download-success intercept (no model call, polls Downloads).
    if (isDownloadCheckInstruction(instruction)) {
      const dl = await waitForDownloadedFile(instruction, ctx.summary);
      const detail = `downloaded ${dl.fileName} (${dl.sizeBytes} bytes)`;
      try {
        await agent.recordToReport?.('Download check', {
          content: [
            `File: ${dl.fileName}`,
            `Path: ${dl.filePath}`,
            `Size: ${dl.sizeBytes} bytes`,
            `Modified: ${dl.modifiedAt}`,
          ].join('\n'),
        });
      } catch { /* report attachment is best-effort */ }
      return detail;
    }
    // 2) Local variable-comparison intercept.
    const cmp = tryLocalComparison(instruction, ctx.variables, ctx.summary);
    if (cmp.handled) {
      // Surface the comparison as a card in the Midscene HTML report so the
      // step doesn't appear to "vanish" from the timeline. Without this,
      // locally-handled asserts (e.g. "A1 和 A2 相等") run silently —
      // passing case but report ends one step short.
      try {
        await agent.recordToReport?.('Local assertion', { content: cmp.result });
      } catch { /* report attachment is best-effort */ }
      return cmp.result;
    }
    // 3) Fallback: real AI assertion (slow, costs tokens).
    await agent.aiAssert(instruction);
    return undefined;
  }

  // aiInput: parse `aiInput("LOCATOR", { value: "X" })` and let the case's
  // params object override X by step.order. The Parameters tab edits these
  // overrides — and because apiGuide stays byte-identical, cacheId is stable
  // so the recorded element location replays from cache. Falls through to
  // the generic eval path if the exampleCode doesn't match the simple shape.
  if (api === 'aiInput') {
    const parsed = extractAiInputArgs(step.exampleCode ?? '');
    if (parsed) {
      const override = ctx.params ? ctx.params[String(step.order)] : undefined;
      const rawValue = (override !== undefined && override !== null && override !== '')
        ? String(override)
        : parsed.value;
      if (override !== undefined && override !== null && override !== '' && String(override) !== parsed.value) {
        ctx.log(`  …param override on step ${step.order}: "${parsed.value}" → "${rawValue}"`);
      }
      const value = await resolveDynamicInputValue(rawValue, {
        field: parsed.locator,
        instruction,
      });
      if (value !== rawValue) {
        ctx.log(`  …dynamic date resolved on step ${step.order}: "${rawValue}" → "${value}"`);
      }
      return await agent.aiInput(parsed.locator, { value });
    }
    // Unrecognized shape — fall through to eval below.
  }

  // aiQuery: call agent directly so we can capture the result, then store it
  // under the variable name parsed from "记录为A2" / "save as X" etc.
  if (api === 'aiQuery') {
    const result = await agent.aiQuery(`string, ${instruction}`, {
      domIncluded: true,
      screenshotIncluded: true,
    });
    captureQueryVariable(instruction, result, ctx.variables, ctx.log);
    return result;
  }

  // aiScroll "滑到最X端": drag, then aiBoolean-compare before/after to
  // confirm visible scroll. Retries the drag inside this dispatch layer up
  // to MAX_DRAG_ATTEMPTS times if aiBoolean says no scroll happened. After
  // exhausting retries, THROWS so the step is marked failed (no more silent
  // "passed" when the scroll didn't actually work).
  //
  // We intentionally retry inside this layer (instead of letting outer
  // executeStepWithRecovery retry) so the before-snapshot stays consistent
  // across attempts — outer retry would re-enter this branch and capture a
  // fresh "before" each time, hiding cumulative no-progress.
  if (api === 'aiScroll') {
    const extreme = detectScrollExtreme(instruction);
    if (extreme && ctx.page) {
      const label = `Step ${step.order} scroll-extreme(${extreme})`;
      const MAX_DRAG_ATTEMPTS = 3;
      let lastReason = '';
      // Capture the "before" snapshot ONCE outside the retry loop. Each
      // attempt's verifier compares "the very start of this step" against
      // the current state — so if the first drag already moved the page,
      // subsequent attempts see the cumulative progress and confirm. If we
      // re-captured before every attempt, attempt 2's "before-scroll" would
      // be attempt 1's after-state and you'd see the confusing report where
      // the "before" frame is already scrolled to the bottom.
      const before = await captureScrollScreenBuffer(ctx.page);
      const beforeBase64 = before ? before.toString('base64') : null;
      const hashBefore = bufferSha1(before);

      for (let attempt = 1; attempt <= MAX_DRAG_ATTEMPTS; attempt += 1) {
        // Snapshot cache RIGHT BEFORE this attempt's drag. If the drag
        // ends up failing verification, we roll back to this snapshot —
        // so the failed attempt's plan/locate writes (which Midscene
        // flushes during the call) don't pollute the cache. Only the
        // SUCCESSFUL attempt's writes survive past the loop.
        const preAttemptCacheSnapshot = ctx.snapshotCacheNow();

        // Drag via computed-target geometry instead of LLM-planned aiAct.
        // Find the slider (one cacheable locate), then drag toward the
        // viewport edge — no need for LLM to guess "scrollbar end".
        try {
          await withTimeout(
            dragSliderToExtreme(agent, ctx.page, extreme, ctx.log),
            SCROLL_DRAG_TIMEOUT_MS,
            `${label} drag attempt ${attempt}`,
          );
        } catch (e) {
          ctx.log(`${label} drag attempt ${attempt} threw: ${normalizeError(e)}`);
          // fall through to verify — maybe drag still moved something
        }

        // Verify by sha1 hash of pre vs post screenshot. Deterministic and
        // 100x faster than aiBoolean — the previous LLM-based comparison was
        // unreliable (e.g. saw "473 items displayed" indicator unchanged and
        // wrongly concluded "page didn't scroll" even when row content was
        // clearly different). Visual hash is fragile to dynamic UI (cursor
        // blink, anti-aliasing) but for SAP table scrolling the row content
        // changes enough that the hash will reliably differ.
        const after = await captureScrollScreenBuffer(ctx.page);
        const hashAfter = bufferSha1(after);
        const hashChanged = !(hashBefore && hashAfter) || hashBefore !== hashAfter;
        if (hashChanged) {
          ctx.log(`${label} hash compare: changed → scroll confirmed (attempt ${attempt}/${MAX_DRAG_ATTEMPTS}).`);
          return undefined; // keep this attempt's writes
        }
        lastReason = 'screenshot hash unchanged after drag';
        ctx.log(`${label} ${lastReason} on attempt ${attempt}/${MAX_DRAG_ATTEMPTS}`);
        // Attempt failed verification → roll cache back to its pre-attempt
        // state so the failed plan/locate entries don't survive into the
        // next attempt or the next run. Without this, failed attempts'
        // writes accumulate and get replayed on subsequent runs.
        ctx.restoreCacheTo(preAttemptCacheSnapshot);
        ctx.log(`${label} attempt ${attempt} cache writes rolled back (only the eventually-successful attempt persists)`);
        // Also invalidate scroll cache so the NEXT attempt forces a fresh
        // LLM plan instead of reusing whatever stale entry might exist.
        if (attempt < MAX_DRAG_ATTEMPTS && typeof ctx.invalidateScrollCache === 'function') {
          ctx.invalidateScrollCache();
        }
        if (attempt < MAX_DRAG_ATTEMPTS) await sleep(STEP_RETRY_DELAY_MS);
      }
      throw new Error(`${label} failed after ${MAX_DRAG_ATTEMPTS} drag attempts (${lastReason})`);
    }
    // Non-extreme aiScroll falls through to the generic eval path below.
  }

  // Everything else (aiTap, aiInput, aiScroll, aiAct, aiHover, …) we eval the
  // apiGuide-supplied exampleCode line as-is. It already handles 2-arg shapes
  // like aiInput("locate", { value: "..." }).
  const code = (step.exampleCode ?? '').trim();
  if (!code) {
    ctx.log(`  …step ${step.order} has no exampleCode, skipping`);
    return undefined;
  }
  // Sleep steps: intercept and log explicitly so users can see the wait
  // happened in Console (tail). Without this, sleep is invisible — Midscene's
  // HTML report only shows AI operations, and the runner's generic eval path
  // is silent.
  const sleepMatch = code.match(/^await\s+sleep\s*\(\s*(\d+(?:\.\d+)?)\s*\)\s*;?\s*$/);
  if (sleepMatch) {
    const ms = Math.max(0, Math.round(Number(sleepMatch[1])));
    ctx.log(`  …sleep ${ms}ms`);
    // Add a card to the Midscene report so the wait is visible in the timeline.
    try {
      await agent.recordToReport?.('Sleep', { content: `Waited ${ms}ms` });
    } catch { /* best-effort */ }
    await sleep(ms);
    return undefined;
  }
  // `sleep` is a helpers.js import in *this* module, not a global, so it's
  // not visible inside AsyncFunction's compiled scope. Inject it explicitly
  // alongside `agent` so wait steps like `await sleep(5000);` work even when
  // they're not the whole exampleCode (sequenced with other calls).
  const fn = new AsyncFunction('agent', 'sleep', code);
  return await fn(agent, sleep);
}

// ── Main entry ────────────────────────────────────────────────────────
export async function runJavascript(caseObj, opts = {}) {
  if (!caseObj?.id) throw new Error('runJavascript: caseObj.id is required');
  if (!caseObj?.apiGuide?.steps?.length) {
    throw new Error('Case has no apiGuide.steps. Generate the API guide first.');
  }
  if (!caseObj.sapUrl?.trim()) {
    throw new Error('Case has no sapUrl. Add a target URL first.');
  }

  const cacheMode = opts.cacheMode === 'read' ? 'read' : 'write';
  const cacheId = buildJavascriptCacheId(caseObj);

  // Self-heal: when case JSON edits roll the cacheId, an old-named file gets
  // stranded. Look up the most recent passed run for this caseId in run-
  // history and rename ITS cache file to the current cacheId. The user
  // already validated that file by passing on it, so it's the safest pick.
  // Silent no-op if current file already exists, or if no passed history.
  // Logs to a tmp buffer because `log()` isn't set up yet at this point.
  const migration = autoMigrateCacheFromLatestPassedRun(caseObj.id, cacheId);

  if (cacheMode === 'read' && !hasUsableCache(cacheId)) {
    throw new Error(
      `No cache for current apiGuide hash. ` +
        `Expected file: midscene_run/cache/${cacheId}.cache.yaml. ` +
        `Run once with cacheMode=write to populate it.`,
    );
  }

  // ── Cache-protection snapshot ────────────────────────────────────────
  // Midscene flushes each step's locate result to the YAML the moment LLM
  // returns it (no end-of-run commit). That's bad when LLM locate-misses to
  // a wrong xpath, because partial / wrong writes pollute the file.
  //
  // Unified policy (both modes):
  //   - Run PASSED → keep whatever Midscene wrote. A fully-passing run
  //     validates every locator Midscene executed, so the recorded xpaths
  //     (new entries or refreshed ones for previously-cached steps that the
  //     LLM re-located) are trustworthy. Lets read-mode runs accumulate
  //     cache for previously-uncached steps automatically.
  //   - Run FAILED → restore the pre-run snapshot. A partial / mid-flight
  //     cache could include bad xpaths from the LLM trying to recover from
  //     the step that ultimately failed.
  let cacheSnapshot = null;
  try {
    cacheSnapshot = fs.readFileSync(resolveCachePath(cacheId));
  } catch (e) {
    // Cache doesn't exist yet (typical for first write-mode run). Snapshot
    // stays null — restore is a no-op, and a fresh cache appears as usual.
    cacheSnapshot = null;
  }

  const runId = newRunId(caseObj.id);
  const active = registerActiveRun({
    runId, caseId: caseObj.id, caseTitle: caseObj.title,
    mode: 'javascript', totalSteps: caseObj.apiGuide.steps.length,
  });

  const startedAtIso = new Date().toISOString();
  const startMs = Date.now();
  const logs = [];
  const log = (line) => {
    logs.push(line);
    appendActiveRunLog(runId, line);
  };

  // Per-run state passed into dispatchStep. summary.assertions/downloads
  // accumulate over the whole run and end up in the persisted record.
  // ctx.params: per-step value overrides keyed by String(step.order). Edited
  // from the Parameters tab. Does NOT influence cacheId (apiGuide is the
  // hash input), so changing values still replays from the same cache file.
  const params = (caseObj.params && typeof caseObj.params === 'object' && !Array.isArray(caseObj.params))
    ? caseObj.params : {};
  const cachePath = resolveCachePath(cacheId);
  const ctx = {
    log,
    params,
    variables: new Map(),
    summary: {
      assertions: [],
      downloads: [],
      downloadStartedAtMs: startMs,
      lastDownloadCheckAtMs: startMs,
    },
    // On-demand scroll-cache invalidation. dispatchStep's aiScroll-extreme
    // verify loop calls this after a failed aiBoolean check so the next
    // attempt's `agent.aiScroll(...)` / `agent.aiAct(...)` misses cache
    // and re-plans via the LLM. Other (non-scroll) cache entries stay.
    invalidateScrollCache() {
      try {
        const scrub = stripScrollCacheEntries(cachePath);
        if (scrub && scrub.removed > 0) {
          log(`  …invalidated ${scrub.removed} scroll cache entries (next attempt will re-plan via LLM)`);
        }
        return scrub;
      } catch (e) {
        log(`  …invalidateScrollCache failed: ${e?.message ?? e}`);
        return null;
      }
    },
    // Per-attempt cache snapshot / restore. Used by the scroll-extreme retry
    // loop to roll back FAILED attempts' cache writes (Midscene flushes plan/
    // locate entries to the YAML as the LLM returns them — those entries
    // persist even if the drag turns out not to scroll the page). Without
    // rollback, all 3 attempts' failed entries accumulate and get replayed
    // next run, wasting time. With rollback, only the successful attempt's
    // entries survive.
    snapshotCacheNow() {
      try {
        if (fs.existsSync(cachePath)) return fs.readFileSync(cachePath);
        return null; // file didn't exist; rollback means delete
      } catch (e) {
        log(`  …snapshotCacheNow failed: ${e?.message ?? e}`);
        return undefined; // sentinel: snapshot couldn't be taken, skip restore
      }
    },
    restoreCacheTo(snapshot) {
      if (snapshot === undefined) return; // snapshot wasn't taken cleanly
      try {
        if (snapshot === null) {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        } else {
          fs.writeFileSync(cachePath, snapshot);
        }
      } catch (e) {
        log(`  …restoreCacheTo failed: ${e?.message ?? e}`);
      }
    },
  };

  log(`Mode: javascript`);
  log(`Cache id: ${cacheId}`);
  log(`Cache strategy: ${cacheMode === 'read' ? 'read-write' : 'write-only'}`);
  log(`Cache path: ${resolveCachePath(cacheId)}`);
  if (migration) {
    log(`Auto-migrated cache: copied ${migration.from} → ${migration.to} ` +
        `(picked up from most recent passed run for this case in run-history; original kept as orphan)`);
  }

  // Per-step cache bypass: user marked specific step.orders to "force re-plan"
  // in the run modal. Snapshot was already taken above, so on failure the
  // original cache (including the stripped entries) gets restored. On pass,
  // the new LLM-relocated entries get kept — effectively "refreshing" only
  // the marked steps without re-recording the whole case.
  const bypassOrders = Array.isArray(opts.noCacheSteps)
    ? opts.noCacheSteps.map((n) => String(n)).filter(Boolean)
    : [];
  if (bypassOrders.length) {
    const ordersSet = new Set(bypassOrders);
    const promptsToStrip = new Set();
    const stepLabels = [];
    for (const s of caseObj.apiGuide.steps) {
      if (!ordersSet.has(String(s.order))) continue;
      const code = s.exampleCode || '';
      const m = code.match(/agent\.ai\w+\s*\(\s*(['"`])([\s\S]*?)\1/);
      if (m) {
        promptsToStrip.add(m[2]);
        stepLabels.push(`step ${s.order} ("${m[2].slice(0, 32)}")`);
      } else {
        log(`Cache bypass: step ${s.order} has no extractable locator — skipped`);
      }
    }
    if (promptsToStrip.size) {
      try {
        const r = stripCacheEntriesByPrompt(resolveCachePath(cacheId), promptsToStrip);
        if (r) {
          log(`Cache bypass: removed ${r.removed} entries for ${stepLabels.join(', ')}` +
              (r.matchedPrompts.length < promptsToStrip.size
                ? ` (note: ${promptsToStrip.size - r.matchedPrompts.length} prompt(s) weren't in cache — already cache-miss)`
                : ''));
        }
      } catch (e) {
        log(`Cache bypass failed (continuing): ${e?.message ?? e}`);
      }
    }
  }
  log(`Target URL: ${caseObj.sapUrl.trim()}`);
  log(`Steps: ${caseObj.apiGuide.steps.length}`);
  const paramKeys = Object.keys(params).filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '');
  if (paramKeys.length) {
    log(`Param overrides: ${paramKeys.length} step${paramKeys.length === 1 ? '' : 's'} (${paramKeys.sort((a, b) => Number(a) - Number(b)).join(', ')})`);
  }

  // ── Scroll-cache policy: try cache first, invalidate on verify failure ──
  // Previously we strip-scrubbed scroll entries up front so every aiScroll
  // step re-planned via LLM. Now we KEEP the cache so the first attempt
  // replays the recorded scrollbar xpath/wheel call. The aiScroll-extreme
  // branch in dispatchStep then aiBoolean-verifies whether the page
  // actually scrolled — only if it didn't do we invalidate the scroll
  // cache (via ctx.invalidateScrollCache) so the retry forces a fresh LLM
  // plan. This way: cache hit + actually scrolled = fast path; cache hit
  // + stale xpath = automatic re-plan; both without permanently losing
  // good scroll cache entries.

  configureLlmProxy();

  let status = 'passed';
  let errorMessage = '';
  const cleanupTasks = [];
  let browser;
  let page;
  let agent;

  try {
    browser = await chromium.launch({
      headless: opts.headed === false,
      args: buildChromeArgs(),
    });
    cleanupTasks.push({ name: 'browser', fn: () => browser.close().catch(() => {}) });

    const context = await browser.newContext({
      viewport: VIEWPORT,
      userAgent: CHROME_UA,
      deviceScaleFactor: 1,
      acceptDownloads: true,
    });
    cleanupTasks.push({ name: 'context', fn: () => context.close().catch(() => {}) });

    // Inject a small default page zoom so SAP WebGUI text and tables render
    // bigger in the spawned Chrome. Runs on every page / sub-frame nav via
    // addInitScript — survives SAP's internal redirects (login → desktop →
    // transaction screen). Overridable via MIDSCENE_PAGE_ZOOM env (e.g. "1.2").
    const pageZoom = Number(process.env.MIDSCENE_PAGE_ZOOM) || 1.1;
    await context.addInitScript((zoom) => {
      const apply = () => {
        if (document.documentElement) {
          document.documentElement.style.zoom = String(zoom);
        }
      };
      apply();
      document.addEventListener('DOMContentLoaded', apply);
    }, pageZoom);

    // Persist Playwright downloads into the user's real Downloads folder so
    // downloads.js (which polls ~/Downloads for fresh files) can detect them.
    // Without this, Playwright stores downloads in a tmp dir keyed off the
    // browser instance and deletes them when the context closes — so the
    // download-success aiAssert step always times out, even though the user
    // sees Chrome flash a "download complete" toast. Mirrors desktop, which
    // works only because it runs the user's real Chrome with the default
    // Downloads directory wired up natively.
    const downloadDir = process.env.MIDSCENE_DOWNLOAD_DIR
      || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Downloads') : null)
      || path.join(ROOT, '..', 'Downloads');
    fs.mkdirSync(downloadDir, { recursive: true });
    context.on('download', async (download) => {
      const name = download.suggestedFilename() || `download-${Date.now()}`;
      const target = path.join(downloadDir, name);
      try {
        await download.saveAs(target);
        log(`Download saved → ${target}`);
      } catch (err) {
        log(`Download save failed for ${name}: ${err?.message ?? err}`);
      }
    });
    page = await context.newPage();
    ctx.page = page;

    await page.goto(caseObj.sapUrl.trim(), { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    agent = new PlaywrightAgent(page, {
      generateReport: true,
      reportFileName: `${runId}.html`,
      groupName: 'SapTest Platform',
      groupDescription: caseObj.title,
      cache: {
        id: cacheId,
        strategy: cacheMode === 'read' ? 'read-write' : 'write-only',
      },
    });

    attachActiveRunCleanup(runId, cleanupTasks);

    for (const [idx, step] of caseObj.apiGuide.steps.entries()) {
      if (active.aborted) throw new Error('Aborted by user');

      const api = normalizeApiName(step);
      setActiveRunStep(runId, { order: step.order, title: step.title, api });
      log(`Step ${step.order}/${caseObj.apiGuide.steps.length}: ${step.title} (${api})`);

      // Before aiQuery, give the freshly-rendered SAP table time to paint
      // before we ask the model to read cells out of it.
      if (api === 'aiQuery') {
        log(`  …waiting ${QUERY_PRE_DELAY_MS}ms pre-query so the table settles`);
        await sleep(QUERY_PRE_DELAY_MS);
        if (active.aborted) throw new Error('Aborted by user');
      }

      // Snapshot Midscene's cache.log size BEFORE the step. After the step,
      // we read the appended bytes and look for "cache hit" / "cache updated"
      // markers to classify this step as a cache HIT, MISS, or unknown
      // (no locator was needed, e.g. aiAssert). Best-effort: any read error
      // just leaves cached=null and the UI shows a neutral badge.
      const cacheLogPath = path.join(ROOT, 'midscene_run', 'log', 'cache.log');
      let cacheLogBytesBefore = 0;
      try { cacheLogBytesBefore = fs.statSync(cacheLogPath).size; } catch { /* file may not exist yet */ }
      let stepStatus = 'passed';
      try {
        const result = await executeStepWithRecovery(agent, step, ctx, dispatchStep);
        if (result !== undefined) {
          log(`  → ${truncate(safeStringify(result), 280)}`);
        }
      } catch (err) {
        stepStatus = 'failed';
        log(`Step ${step.order} FAILED: ${err?.message ?? err}`);
        try { await captureStepScreenshot(page, runId, step, 'failed', null); }
        catch { /* swallow — error path */ }
        throw err;
      }
      let cached = null;
      try {
        const sz = fs.statSync(cacheLogPath).size;
        if (sz > cacheLogBytesBefore) {
          const fd = fs.openSync(cacheLogPath, 'r');
          const buf = Buffer.alloc(sz - cacheLogBytesBefore);
          fs.readSync(fd, buf, 0, buf.length, cacheLogBytesBefore);
          fs.closeSync(fd);
          const appended = buf.toString('utf8');
          if (/cache hit/.test(appended))                          cached = true;
          else if (/will call updateFn|cache updated/.test(appended)) cached = false;
        }
      } catch { /* leave cached = null */ }
      await captureStepScreenshot(page, runId, step, stepStatus, cached);

      if (idx < caseObj.apiGuide.steps.length - 1) {
        const delayMs = delayAfterStepMs(step);
        if (delayMs >= 3000) {
          log(`  …waiting ${delayMs}ms (Execute-class step, server query in flight)`);
        }
        await sleep(delayMs);
      }
    }

    setActiveRunStep(runId, null);
    log('Midscene JS run completed.');
  } catch (err) {
    status = 'failed';
    errorMessage = active.aborted ? 'Aborted by user' : err?.message ?? String(err);
    log(`Error: ${errorMessage}`);
  } finally {
    for (const t of [...cleanupTasks].reverse()) {
      try { await t.fn(); }
      catch (e) { log(`Cleanup(${t.name}) failed: ${e?.message ?? e}`); }
    }
    // Restore the pre-run cache snapshot. See the snapshot block above:
    //   - run failed → restore (don't persist a partial / mid-flight cache)
    //   - run passed → keep whatever Midscene wrote (validated by the run)
    const shouldRestore = cacheSnapshot && status !== 'passed';
    if (shouldRestore) {
      try {
        fs.writeFileSync(resolveCachePath(cacheId), cacheSnapshot);
        log(`Cache protection: restored ${cacheSnapshot.length} bytes (run ended with status=${status}, rolling back partial cache).`);
      } catch (e) {
        log(`Cache restore failed (continuing): ${e?.message ?? e}`);
      }
    } else if (status === 'passed') {
      const finalSize = (() => {
        try { return fs.statSync(resolveCachePath(cacheId)).size; } catch { return null; }
      })();
      const baselineSize = cacheSnapshot ? cacheSnapshot.length : 0;
      const delta = finalSize != null ? finalSize - baselineSize : null;
      const deltaStr = delta == null ? '' : (delta > 0 ? ` (+${delta} bytes vs baseline)` : delta < 0 ? ` (${delta} bytes vs baseline)` : ' (unchanged vs baseline)');
      log(`Cache protection: run passed, keeping ${finalSize ?? '?'} bytes of recorded cache${deltaStr}.`);
    }
    unregisterActiveRun(runId);
  }

  // ── Persist run record ────────────────────────────────────────────
  const finishedAtIso = new Date().toISOString();
  const durationMs = Date.now() - startMs;
  const reportName = `${runId}.html`;
  const reportFsPath = path.join(ROOT, 'midscene_run', 'report', reportName);
  const reportUrl = fs.existsSync(reportFsPath) ? `/reports/${reportName}` : '';

  // Append a human-readable summary block to the end of stdout so any UI that
  // just shows logTail gets the headline numbers without parsing summary.
  const summaryLines = ['===== Result Summary ====='];
  if (ctx.variables.size === 0) summaryLines.push('Variables: (none)');
  else {
    summaryLines.push('Variables:');
    for (const [n, v] of ctx.variables.entries()) summaryLines.push(`  ${n} = ${String(v ?? '')}`);
  }
  if (ctx.summary.assertions.length === 0) summaryLines.push('Comparisons: (none)');
  else {
    summaryLines.push('Comparisons:');
    for (const a of ctx.summary.assertions) {
      const op = a.operator ?? (a.equal ? '==' : '!=');
      const passed = a.passed ?? a.equal;
      summaryLines.push(`  ${a.left}=${a.leftValue} ${op} ${a.right}=${a.rightValue} → ${passed ? 'passed' : 'failed'}`);
    }
  }
  if (ctx.summary.downloads.length === 0) summaryLines.push('Downloads: (none)');
  else {
    summaryLines.push('Downloads:');
    for (const d of ctx.summary.downloads) summaryLines.push(`  ${d.fileName} (${d.sizeBytes} bytes) → ${d.filePath}`);
  }
  summaryLines.push(`Status: ${status}`);
  if (status === 'failed') summaryLines.push(`Failure reason: ${errorMessage || 'no error detail'}`);
  summaryLines.push('===== End Summary =====');
  logs.push('', ...summaryLines);

  const record = {
    runId,
    caseId: caseObj.id,
    spec: null,
    mode: 'javascript',
    headed: opts.headed !== false,
    useCache: cacheMode === 'read',
    cacheStrategy: cacheMode === 'read' ? 'read-write' : 'write-only',
    cacheId,
    startedAt: startedAtIso,
    finishedAt: finishedAtIso,
    durationMs,
    exitCode: status === 'passed' ? 0 : 1,
    status,
    startedBy: opts.startedByUsername ?? null,
    errorMessage,
    report: reportUrl ? { name: reportName, url: reportUrl } : null,
    events: [],
    runSummary: {
      variables: Object.fromEntries(
        [...ctx.variables.entries()].map(([k, v]) => [k, String(v ?? '')]),
      ),
      assertions: ctx.summary.assertions,
      downloads: ctx.summary.downloads.map((d) => ({
        fileName: d.fileName,
        filePath: d.filePath,
        sizeBytes: d.sizeBytes,
        modifiedAt: d.modifiedAt,
      })),
    },
    logTail: logs.slice(-600),
  };

  fs.mkdirSync(RUNS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(RUNS_DIR, `${runId}.json`),
    JSON.stringify(record, null, 2),
    'utf8',
  );
  return record;
}

// ── small helpers used only here ─────────────────────────────────────
function newRunId(caseId) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '');
  const slug = String(caseId).slice(0, 8);
  return `${ts}-jsrun-${slug}-${crypto.randomBytes(2).toString('hex')}`;
}

function buildChromeArgs() {
  return [
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    '--force-device-scale-factor=1',
    '--high-dpi-support=1',
    '--no-first-run',
    '--no-default-browser-check',
  ];
}
