// Materialize a cache slot file from a source snapshot + user config.
//
// The flow:
//   1. The case has TWO slot files: <base>-pass.cache.yaml and
//      <base>-fail.cache.yaml. Midscene reads/writes whichever the
//      current run mode selected.
//   2. The slot files don't have to be the same as "what the last run
//      left behind" — the user can configure (via the Cache Debug page)
//      a SOURCE (any past run's snapshot, or "auto: latest of kind")
//      plus a set of modifications:
//        · excludeSteps[]  → drop entries for those specific step orders
//        · dropTailCount   → drop the last N steps' entries (fail slot
//                            default: 2; used to scrub bad xpaths from
//                            the steps adjacent to the failure point)
//   3. This module is the "rebuild from source + config" function. The
//      runner calls it just before a run begins so Midscene sees the
//      freshly-materialized slot file.

import fs from 'node:fs';
import { stripCacheEntriesByPrompt } from './cache-scrub.js';
import { copyCacheFileForId } from './cache-id.js';

const LEGACY_INPUT_PROMPT_SUFFIX = '\u53f3\u4fa7\u8f93\u5165\u6846\u672c\u8eab\uff0c\u4e0d\u8981\u5b9a\u4f4d\u5de6\u4fa7\u6807\u7b7e\u6587\u5b57';

// Extract the cache-key prompt(s) from a step's exampleCode — same
// rules the recovery layer + runner use elsewhere. The cache YAML
// indexes entries by these strings, so to "exclude this step from
// cache" we strip rows whose `prompt:` field matches.
export function extractStepLocatorPrompts(step) {
  const code = step?.exampleCode || '';
  if (!code) return [];
  const out = [];
  // aiTap / aiInput / aiHover / aiKeyboardPress: first string arg.
  const re1 = /agent\.ai(?:Tap|Input|Hover|KeyboardPress)\s*\(\s*(['"`])([\s\S]*?)\1/g;
  let m;
  while ((m = re1.exec(code)) !== null) out.push(m[2]);
  // aiScroll: second arg (after opts object).
  const re2 = /agent\.aiScroll\s*\(\s*(?:\{[\s\S]*?\}|(['"`])[\s\S]*?\1)\s*,\s*(['"`])([\s\S]*?)\2/g;
  while ((m = re2.exec(code)) !== null) out.push(m[3]);
  return out;
}

function extractAiInputLocatorPrompts(step) {
  const code = step?.exampleCode || '';
  if (!code) return [];
  const out = [];
  const re = /agent\.aiInput\s*\(\s*(['"`])([\s\S]*?)\1/g;
  let m;
  while ((m = re.exec(code)) !== null) out.push(m[2]);
  return out;
}

function rewriteLegacyInputPromptAliases(cachePath, apiGuideSteps) {
  const aliases = new Map();
  for (const step of apiGuideSteps || []) {
    for (const prompt of extractAiInputLocatorPrompts(step)) {
      const current = String(prompt ?? '').trim();
      if (!current) continue;
      aliases.set(`${current} ${LEGACY_INPUT_PROMPT_SUFFIX}`, current);
    }
  }
  if (aliases.size === 0 || !fs.existsSync(cachePath)) return 0;

  let rewrites = 0;
  const raw = fs.readFileSync(cachePath, 'utf8');
  const next = raw.replace(/^(\s*prompt:\s*)(.*?)(\s*)$/gm, (line, prefix, value, suffix) => {
    const replacement = aliases.get(String(value ?? '').trim());
    if (!replacement) return line;
    rewrites += 1;
    return `${prefix}${replacement}${suffix}`;
  });
  if (rewrites > 0) fs.writeFileSync(cachePath, next);
  return rewrites;
}

// Given a list of step orders to exclude + the case's apiGuide.steps,
// return the set of prompt strings the cache-scrub needs to strip.
// Idempotent — same input always produces the same set.
export function promptsForExcludedSteps(excludeStepOrders, apiGuideSteps) {
  const orderSet = new Set((excludeStepOrders || []).map(Number));
  const prompts = new Set();
  for (const step of apiGuideSteps || []) {
    if (!orderSet.has(step.order)) continue;
    for (const p of extractStepLocatorPrompts(step)) prompts.add(p);
  }
  return prompts;
}

// Top-level: copy source → target, then strip configured prompts +
// drop-tail prompts. Source may be null/missing (= start the slot
// empty); in that case we just remove the target file if it exists.
//
// Returns a small report so the runner can log "rebuilt fail slot
// from run X, dropped 4 entries (2 manual, 2 from tail-strip)".
export function buildCacheSlot({
  sourceSnapshotPath,
  targetSlotPath,
  targetCacheId,
  apiGuideSteps,
  excludeStepOrders = [],
  dropTailCount = 0,
}) {
  const steps = Array.isArray(apiGuideSteps) ? apiGuideSteps : [];
  const report = {
    sourceUsed: null,
    entriesRemoved: 0,
    promptsExcluded: [],
    droppedTail: 0,
    promptsRewritten: 0,
  };

  // No source → empty slot. Remove any stale target file so Midscene
  // starts from scratch.
  if (!sourceSnapshotPath || !fs.existsSync(sourceSnapshotPath)) {
    try { if (fs.existsSync(targetSlotPath)) fs.unlinkSync(targetSlotPath); }
    catch { /* best-effort */ }
    return report;
  }

  // Copy source → target.
  if (targetCacheId) {
    copyCacheFileForId(sourceSnapshotPath, targetSlotPath, targetCacheId);
  } else {
    fs.copyFileSync(sourceSnapshotPath, targetSlotPath);
  }
  report.sourceUsed = sourceSnapshotPath;
  report.promptsRewritten = rewriteLegacyInputPromptAliases(targetSlotPath, steps);

  // Compute the prompt set to strip: manual excludes + (optionally)
  // the last N steps' prompts. Tail-strip uses the steps in
  // apiGuide order — the LAST `dropTailCount` ones.
  const promptsToRemove = promptsForExcludedSteps(excludeStepOrders, steps);
  if (dropTailCount > 0 && steps.length > 0) {
    const tail = steps.slice(Math.max(0, steps.length - dropTailCount));
    for (const s of tail) {
      for (const p of extractStepLocatorPrompts(s)) promptsToRemove.add(p);
    }
    report.droppedTail = Math.min(dropTailCount, steps.length);
  }
  report.promptsExcluded = [...promptsToRemove];

  if (promptsToRemove.size > 0) {
    const r = stripCacheEntriesByPrompt(targetSlotPath, promptsToRemove);
    if (r) report.entriesRemoved = r.removed;
  }
  return report;
}
