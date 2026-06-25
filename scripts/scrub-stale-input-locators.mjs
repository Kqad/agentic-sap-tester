// One-shot: scrub stale bare-locator aiInput entries from pass-slot caches.
//
// Background: commit 846d916 added `inputLocatorForPrompt`, which appends
// "右侧输入框本身，不要定位左侧标签文字" to every aiInput locator before
// calling agent.aiInput(...). Midscene's cache is keyed by the full prompt
// string, so old entries with the BARE locator (e.g. "company code") can
// never be hit again — and worse, the cached xpaths there usually point to
// the label, not the input, which is what the suffix was meant to fix.
//
// This script:
//   1. lists every *-pass.cache.yaml (skipping saptest11 per user request),
//   2. reads the matching e2e/cases/<id>.json,
//   3. extracts every aiInput("LOCATOR", ...) bare locator from jsSource +
//      apiGuide.steps[].exampleCode,
//   4. drops cache entries whose prompt matches one of those bare locators.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripCacheEntriesByPrompt } from '../server/midscene/cache-scrub.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'midscene_run', 'cache');
const CASES_DIR = path.join(ROOT, 'e2e', 'cases');

const SKIP_CASE_IDS = new Set(['saptest11']);

const PASS_RE = /^saptest-js-(.+)-[a-f0-9]{12}-pass\.cache\.yaml$/;
const AI_INPUT_RE = /aiInput\s*\(\s*(['"`])([\s\S]*?)\1\s*,/g;

function extractBareInputLocators(caseJson) {
  const out = new Set();
  const harvest = (code) => {
    if (!code) return;
    let m;
    AI_INPUT_RE.lastIndex = 0;
    while ((m = AI_INPUT_RE.exec(code)) !== null) {
      const raw = m[2]
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
        .replace(/\\(["'`\\])/g, '$1');
      // Skip locators that already carry the suffix (they're fresh).
      if (/右侧输入框本身|输入框本身|右侧输入框|input field|editable field/i.test(raw)) continue;
      out.add(raw);
    }
  };
  harvest(caseJson.jsSource);
  for (const s of caseJson?.apiGuide?.steps ?? []) {
    harvest(s.exampleCode);
  }
  return out;
}

const passFiles = readdirSync(CACHE_DIR)
  .filter((f) => PASS_RE.test(f))
  .sort();

let totalRemoved = 0;
const skipped = [];
const noLocators = [];
const noMatches = [];

for (const file of passFiles) {
  const caseId = PASS_RE.exec(file)[1];
  if (SKIP_CASE_IDS.has(caseId)) {
    skipped.push(file);
    continue;
  }
  const casePath = path.join(CASES_DIR, `${caseId}.json`);
  if (!existsSync(casePath)) {
    console.log(`! ${file}  →  no case JSON at e2e/cases/${caseId}.json — skipped`);
    continue;
  }
  let caseObj;
  try {
    caseObj = JSON.parse(readFileSync(casePath, 'utf8'));
  } catch (e) {
    console.log(`! ${file}  →  case JSON parse failed: ${e.message}`);
    continue;
  }
  const locators = extractBareInputLocators(caseObj);
  if (locators.size === 0) {
    noLocators.push(file);
    continue;
  }
  const cachePath = path.join(CACHE_DIR, file);
  const result = stripCacheEntriesByPrompt(cachePath, locators);
  if (!result) {
    console.log(`! ${file}  →  scrub returned null`);
    continue;
  }
  if (result.removed === 0) {
    noMatches.push({ file, locators: [...locators] });
    continue;
  }
  totalRemoved += result.removed;
  console.log(`✓ ${file}`);
  console.log(`    removed ${result.removed} entries; matched prompts:`);
  for (const p of result.matchedPrompts) console.log(`      · ${p}`);
}

console.log('\n── summary ──');
console.log(`pass-slot files scanned: ${passFiles.length}`);
console.log(`skipped (saptest11):     ${skipped.length}`);
console.log(`no aiInput locators:     ${noLocators.length}${noLocators.length ? ` (${noLocators.join(', ')})` : ''}`);
console.log(`no matching entries:     ${noMatches.length}${noMatches.length ? ` (${noMatches.map(x => x.file).join(', ')})` : ''}`);
console.log(`total entries removed:   ${totalRemoved}`);
