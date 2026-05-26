// One-shot migration: rename existing midscene_run/cache/*.cache.yaml files
// to match the current cache-id.js hash function.
//
// Hash function history (most recent first):
//   v4c (current): same as v4b but also drops sleep steps and uses sequential index
//   v4b:           sha1(caseId + runtimeOnlyApiGuide + tcodeValues.join("|"))
//   v4a:           sha1(caseId + valueStrippedApiGuide + tcodeValues.join("|"))
//   v3b:           sha1(caseId + apiGuide + tcodeValues.join("|"))
//   v3a:           sha1(caseId + apiGuide + firstTCodeValue)
//   v2:            sha1(caseId + apiGuide)
//   v1 (Desktop):  sha1(caseId + naturalLanguage + apiGuide)
//
// For each case JSON, this script computes all three hashes and renames the
// matching cache file (under v1 or v2) to the v3 name. Idempotent: rerunning
// after migration is a no-op (file is already at v3 name).
//
// Orphan caches (file hash doesn't match any of v1/v2/v3 for any case) are
// listed but NOT touched — they're caches from earlier case states.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CASES_DIR = join(ROOT, 'e2e', 'cases');
const CACHE_DIR = join(ROOT, 'midscene_run', 'cache');

function v1Hash(caseObj) {
  return createHash('sha1')
    .update(String(caseObj.id))
    .update(String(caseObj.naturalLanguage ?? ''))
    .update(JSON.stringify(caseObj.apiGuide ?? null))
    .digest('hex').slice(0, 12);
}
function v2Hash(caseObj) {
  return createHash('sha1')
    .update(String(caseObj.id))
    .update(JSON.stringify(caseObj.apiGuide ?? null))
    .digest('hex').slice(0, 12);
}
function effectiveTCode(caseObj) {
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
// First-tcode-only variant from the previous migration run — kept so files
// renamed under that scheme can be picked up and re-renamed.
function effectiveTCodeFirstOnly(caseObj) {
  const joined = effectiveTCode(caseObj);
  return joined.split('|')[0] || '';
}
function v3aHash(caseObj) {
  return createHash('sha1')
    .update(String(caseObj.id))
    .update(JSON.stringify(caseObj.apiGuide ?? null))
    .update(effectiveTCodeFirstOnly(caseObj))
    .digest('hex').slice(0, 12);
}
function v3bHash(caseObj) {
  return createHash('sha1')
    .update(String(caseObj.id))
    .update(JSON.stringify(caseObj.apiGuide ?? null))
    .update(effectiveTCode(caseObj))
    .digest('hex').slice(0, 12);
}
function stripValueLiterals(code) {
  if (!code) return code;
  return code.replace(/(\{\s*value\s*:\s*)(['"`])([\s\S]*?)\2(\s*\})/g, '$1$2$2$4');
}
// v4a: only strip exampleCode values; keep step title/instruction/reason etc.
function normalizeApiGuideV4a(apiGuide) {
  if (!apiGuide || !Array.isArray(apiGuide.steps)) return apiGuide ?? null;
  return { ...apiGuide, steps: apiGuide.steps.map((s) => ({ ...s, exampleCode: stripValueLiterals(s.exampleCode) })) };
}
// v4b: keep only runtime-affecting fields per step; drop all descriptive text.
function normalizeApiGuideV4b(apiGuide) {
  if (!apiGuide || !Array.isArray(apiGuide.steps)) return null;
  return { steps: apiGuide.steps.map((s) => ({ order: s.order, midsceneApi: s.midsceneApi, xpath: s.xpath, exampleCode: stripValueLiterals(s.exampleCode) })) };
}
// v4c: also drops sleep steps and replaces `order` with sequential `index`.
function isSleepStepHelper(s) {
  return /^\s*await\s+sleep\s*\(/.test(s?.exampleCode || '');
}
function normalizeApiGuideV4c(apiGuide) {
  if (!apiGuide || !Array.isArray(apiGuide.steps)) return null;
  return {
    steps: apiGuide.steps
      .filter((s) => !isSleepStepHelper(s))
      .map((s, i) => ({ index: i, midsceneApi: s.midsceneApi, xpath: s.xpath, exampleCode: stripValueLiterals(s.exampleCode) })),
  };
}
function v4aHash(caseObj) {
  return createHash('sha1')
    .update(String(caseObj.id))
    .update(JSON.stringify(normalizeApiGuideV4a(caseObj.apiGuide)))
    .update(effectiveTCode(caseObj))
    .digest('hex').slice(0, 12);
}
function v4bHash(caseObj) {
  return createHash('sha1')
    .update(String(caseObj.id))
    .update(JSON.stringify(normalizeApiGuideV4b(caseObj.apiGuide)))
    .update(effectiveTCode(caseObj))
    .digest('hex').slice(0, 12);
}
function v4cHash(caseObj) {
  return createHash('sha1')
    .update(String(caseObj.id))
    .update(JSON.stringify(normalizeApiGuideV4c(caseObj.apiGuide)))
    .update(effectiveTCode(caseObj))
    .digest('hex').slice(0, 12);
}

const caseFiles = readdirSync(CASES_DIR).filter((n) => n.endsWith('.json'));
const cacheFiles = new Set(readdirSync(CACHE_DIR).filter((n) => n.endsWith('.cache.yaml')));

let renamed = 0, alreadyMigrated = 0, missingCache = 0;
const orphans = new Set(cacheFiles);

for (const f of caseFiles) {
  const id = f.replace(/\.json$/, '');
  const body = JSON.parse(readFileSync(join(CASES_DIR, f), 'utf8'));
  const caseObj = { id, ...body };
  const h1 = v1Hash(caseObj);
  const h2 = v2Hash(caseObj);
  const h3a = v3aHash(caseObj);
  const h3b = v3bHash(caseObj);
  const h4a = v4aHash(caseObj);
  const h4b = v4bHash(caseObj);
  const h4c = v4cHash(caseObj);
  const currentName = `saptest-js-${id}-${h4c}.cache.yaml`;

  if (cacheFiles.has(currentName)) {
    alreadyMigrated++;
    orphans.delete(currentName);
    continue;
  }

  let source = null;
  for (const oldHash of [h4b, h4a, h3b, h3a, h2, h1]) {
    if (oldHash === h4c) continue;
    const name = `saptest-js-${id}-${oldHash}.cache.yaml`;
    if (cacheFiles.has(name)) { source = name; break; }
  }
  if (source) {
    renameSync(join(CACHE_DIR, source), join(CACHE_DIR, currentName));
    console.log(`renamed: ${source} -> ${currentName}  (case ${id})`);
    renamed++;
    orphans.delete(source);
    continue;
  }
  missingCache++;
}

console.log(`\nSummary: renamed=${renamed}  alreadyMigrated=${alreadyMigrated}  noCacheForCase=${missingCache}`);
if (orphans.size) {
  console.log(`\nOrphan cache files (hash matches no current case state, not touched):`);
  for (const o of orphans) console.log(`  ${o}`);
}
