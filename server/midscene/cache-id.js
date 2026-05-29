// Cache-ID derivation. Hash inputs: caseId + value-stripped apiGuide +
// effective TCode value.
//
// Why value-stripped apiGuide: cache YAML stores LLM-discovered element
// positions anchored to the LOCATOR STRINGS in apiGuide.steps[].exampleCode.
// Changing a locator or step structure invalidates the recorded xpath, so
// we hash those. But changing a `value: "..."` literal (the default input
// content baked into exampleCode) does NOT move any xpath — same field on
// the same screen, just different text typed. So we strip `value: "..."`
// out of exampleCode before hashing. This makes the hash insensitive to
// default-value edits — whether the user changes it via Parameters override,
// NL edit + Gen API re-roll, or raw JSON edit.
//
// Why TCode value (special-cased): tcode picks WHICH SAP screen we land on.
// Every other aiInput step's xpath is recorded on that screen. Change tcode
// and the recorded xpaths point to elements on the wrong (or non-existent)
// screen — same hash but semantically wrong. So we fold the effective tcode
// value (params override or apiGuide default) into the hash separately,
// forcing a re-record when tcode changes. Detection is by locator pattern:
// SAP-style "矩形" / "TC框" / "T-Code".
//
// What's NOT in the hash: naturalLanguage, non-tcode params, title, sapUrl,
// description, exampleCode `value: "..."` defaults — all "input content"
// that doesn't move element xpaths.
//
// Per-case opt-in: if caseObj.cacheStrategy === 'first-5-only', the hash
// uses ONLY the first 5 non-sleep apiGuide steps and ignores TCode. This
// is the new-case-template default, so the shared pre-TCode Menu/Settings
// cache survives TCode changes and apiGuide regen for steps 6+. Old cases
// without this field stay on the full-hash behavior — their cache YAMLs
// keep matching their existing filenames.
//
// Scroll-extreme normalization: any step whose NL or exampleCode matches a
// "drag/scroll to last edge" pattern is collapsed to a canonical
// "scroll-extreme:<direction>" key in the hash. Lets us swap between
// agent.aiAct("...拖到最底端") and agent.aiScroll({scrollType:'scrollToBottom'})
// (or re-word the drag prompt) without rolling the cacheId.
//
// Diverges from the Desktop project's buildJavascriptCacheId. Existing cache
// files were migrated by scripts/rename-cache-ids.mjs (one-shot, idempotent).

import { createHash } from 'node:crypto';
import path from 'node:path';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { ROOT } from '../paths.js';
import { detectScrollExtreme } from './helpers.js';

// Scroll-extreme steps ("滑到最底端", "拖到最右", etc.) can be authored as
// EITHER `agent.aiAct("按住...拖到最X端")` OR `agent.aiScroll({ scrollType:
// 'scrollToBottom' })` — they produce the same logical motion. Switching
// between the two forms (or tweaking the prompt wording inside aiAct)
// should NOT roll the cacheId. Returns a stable canonical string like
// "scroll-extreme:bottom" when the step is scroll-extreme, else null.
function canonicalScrollExtreme(step) {
  const nl = step?.naturalLanguageInstruction ?? '';
  const code = step?.exampleCode ?? '';
  const dir = detectScrollExtreme(nl)
    || detectScrollExtreme(code);
  if (dir) return `scroll-extreme:${dir}`;
  // Cover aiScroll({scrollType:'scrollToTop|Bottom|Left|Right'}) where the
  // NL might be too vague for detectScrollExtreme to fire.
  const m = /scrollType\s*:\s*(['"`])scrollTo(Top|Bottom|Left|Right)\1/i.exec(code);
  if (m) {
    return `scroll-extreme:${m[2].toLowerCase()}`;
  }
  return null;
}

// Returns every tcode value in the case, in step-order, joined with "|".
// A "tcode step" is any aiInput step whose locator matches the SAP tcode
// conventions (矩形 / TC 框 / T-Code / 事务码). saptest4 has TWO tcode steps
// (FBL1N then /n/UI2/FLP) — both must contribute to the hash because either
// switching screens away from the recorded one invalidates downstream xpaths.
// Effective value = params override if present, else apiGuide default.
export function getEffectiveTCodeValue(caseObj) {
  const steps = caseObj?.apiGuide?.steps ?? [];
  const params = (caseObj?.params && typeof caseObj.params === 'object' && !Array.isArray(caseObj.params))
    ? caseObj.params : {};
  const values = [];
  for (const s of steps) {
    if (!String(s.midsceneApi || '').toLowerCase().includes('aiinput')) continue;
    const m = /aiInput\s*\(\s*(['"`])([\s\S]*?)\1\s*,\s*\{\s*value\s*:\s*(['"`])([\s\S]*?)\3\s*\}\s*\)/.exec(s.exampleCode || '');
    if (!m) continue;
    const locator = m[2];
    if (!/矩形|TC\s*框|T[-\s]?Code|事务码/i.test(locator)) continue;
    const orderKey = String(s.order);
    const defaultValue = m[4];
    const override = orderKey in params ? String(params[orderKey] ?? '') : null;
    values.push(override !== null && override !== '' ? override : defaultValue);
  }
  return values.join('|');
}

// Replace every `value: "..."` literal inside an exampleCode string with
// `value: ""` so default value changes don't ripple into the hash. Tcode
// values are captured separately via getEffectiveTCodeValue.
function stripValueLiteralsFromExampleCode(code) {
  if (!code) return code;
  return code.replace(/(\{\s*value\s*:\s*)(['"`])([\s\S]*?)\2(\s*\})/g, '$1$2$2$4');
}
// Sleep steps (`await sleep(3000);`) are pure timing — no UI element, not
// recorded in cache YAML. Adding / removing / changing the duration of a
// sleep step must not invalidate cache.
function isSleepStep(step) {
  return /^\s*await\s+sleep\s*\(/.test(step?.exampleCode || '');
}
// Reduce apiGuide to ONLY the fields that influence runtime cache matching.
// Per remaining (non-sleep) step we keep:
//   - sequential index (replaces `order`, so inserting/removing a sleep step
//     doesn't shift other steps' visible position in the hash)
//   - midsceneApi (dispatcher branch)
//   - xpath (aiTap xpath override)
//   - exampleCode with values stripped (locator strings passed to
//     agent.aiInput/aiTap/etc)
// Descriptive fields — title, naturalLanguageInstruction, reason, plus
// top-level summary/assumptions/markdown/warnings — are stripped because the
// cache YAML only matches by locator prompt, not by these strings. This
// means Gen API re-rolling titles/instructions doesn't rotate the hash if
// the locator strings come back the same.
// `stepLimit`: if finite, slice to the first N non-sleep steps. Used by the
// per-case `cacheStrategy === 'first-5-only'` opt-in.
function normalizeApiGuideForHash(apiGuide, stepLimit = Infinity) {
  if (!apiGuide || !Array.isArray(apiGuide.steps)) return null;
  return {
    steps: apiGuide.steps
      .filter((s) => !isSleepStep(s))
      .slice(0, stepLimit)
      .map((s, i) => {
        // Scroll-extreme: collapse aiAct(...drag...) and aiScroll({scrollType
        // :...}) variants into one canonical token so switching between them
        // (or tweaking the drag prompt wording) doesn't roll the cacheId.
        const scrollKey = canonicalScrollExtreme(s);
        if (scrollKey) {
          return {
            index: i,
            midsceneApi: 'aiScrollExtreme',
            xpath: s.xpath,
            exampleCode: scrollKey,
          };
        }
        return {
          index: i,
          midsceneApi: s.midsceneApi,
          xpath: s.xpath,
          exampleCode: stripValueLiteralsFromExampleCode(s.exampleCode),
        };
      }),
  };
}

export function buildJavascriptCacheId(caseObj) {
  const useFirst5Only = caseObj?.cacheStrategy === 'first-5-only';
  const stepLimit = useFirst5Only ? 5 : Infinity;
  const hash = createHash('sha1')
    .update(String(caseObj.id))
    .update(JSON.stringify(normalizeApiGuideForHash(caseObj.apiGuide, stepLimit)));
  if (!useFirst5Only) {
    hash.update(getEffectiveTCodeValue(caseObj));
  }
  return `saptest-js-${caseObj.id}-${hash.digest('hex').slice(0, 12)}`;
}

export function resolveCachePath(cacheId) {
  return path.join(ROOT, 'midscene_run', 'cache', `${cacheId}.cache.yaml`);
}

// Check cache existence + at least one "caches:" record. Avoid pulling in a
// YAML parser just for this — a substring match is plenty robust for our use:
// Midscene always writes either `caches: []` (empty) or `caches:\n  - type:`.
export function hasUsableCache(cacheId) {
  const file = resolveCachePath(cacheId);
  if (!existsSync(file)) return false;
  try {
    if (statSync(file).size < 30) return false;
    const head = readFileSync(file, 'utf8');
    return /caches:\s*\n\s*-\s+/.test(head);
  } catch {
    return false;
  }
}
