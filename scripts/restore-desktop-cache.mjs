// One-shot: for each current case in e2e/cases/, look up its source.desktopCaseId,
// find the LARGEST cache YAML under Desktop\saptest\saptest\midscene_run\cache\
// (which is the most-complete historical recording for that case), and copy it
// to midscene_run/cache/ under the current v3b hash name.
//
// Doesn't overwrite if the destination already has a larger file. Dry-run by
// default; pass --apply to actually copy.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, copyFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APPLY = process.argv.includes('--apply');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CASES_DIR = join(ROOT, 'e2e', 'cases');
const DEST_DIR = join(ROOT, 'midscene_run', 'cache');
const DESKTOP_CACHE_DIR = 'C:\\Users\\BOG1SGH\\Desktop\\saptest\\saptest\\midscene_run\\cache';

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
function stripValueLiterals(code) {
  if (!code) return code;
  return code.replace(/(\{\s*value\s*:\s*)(['"`])([\s\S]*?)\2(\s*\})/g, '$1$2$2$4');
}
function isSleepStep(s) {
  return /^\s*await\s+sleep\s*\(/.test(s?.exampleCode || '');
}
function normalizeApiGuide(apiGuide) {
  if (!apiGuide || !Array.isArray(apiGuide.steps)) return null;
  return {
    steps: apiGuide.steps
      .filter((s) => !isSleepStep(s))
      .map((s, i) => ({ index: i, midsceneApi: s.midsceneApi, xpath: s.xpath, exampleCode: stripValueLiterals(s.exampleCode) })),
  };
}
function v3bHash(caseObj) {
  return createHash('sha1')
    .update(String(caseObj.id))
    .update(JSON.stringify(normalizeApiGuide(caseObj.apiGuide)))
    .update(effectiveTCode(caseObj))
    .digest('hex').slice(0, 12);
}

const desktopFiles = existsSync(DESKTOP_CACHE_DIR)
  ? readdirSync(DESKTOP_CACHE_DIR).filter((n) => n.endsWith('.cache.yaml'))
  : [];

if (!desktopFiles.length) {
  console.log('No Desktop cache files found at', DESKTOP_CACHE_DIR);
  process.exit(0);
}

// Group desktop files by their UUID prefix.
const byUuid = new Map();
for (const f of desktopFiles) {
  const m = f.match(/^saptest-js-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i);
  if (!m) continue;
  const uuid = m[1];
  const size = statSync(join(DESKTOP_CACHE_DIR, f)).size;
  if (!byUuid.has(uuid)) byUuid.set(uuid, []);
  byUuid.get(uuid).push({ name: f, size });
}

const caseFiles = readdirSync(CASES_DIR).filter((n) => n.endsWith('.json'));
const plan = [];

for (const f of caseFiles) {
  const id = f.replace(/\.json$/, '');
  const body = JSON.parse(readFileSync(join(CASES_DIR, f), 'utf8'));
  const uuid = body?.source?.desktopCaseId;
  if (!uuid) continue;
  const candidates = byUuid.get(uuid);
  if (!candidates?.length) {
    plan.push({ id, status: 'no-desktop-cache' });
    continue;
  }
  candidates.sort((a, b) => b.size - a.size);
  const best = candidates[0];
  const caseObj = { id, ...body };
  const hash = v3bHash(caseObj);
  const destName = `saptest-js-${id}-${hash}.cache.yaml`;
  const destPath = join(DEST_DIR, destName);
  const destSize = existsSync(destPath) ? statSync(destPath).size : 0;

  plan.push({
    id,
    uuid,
    desktopName: best.name,
    desktopSize: best.size,
    destName,
    destSize,
    skip: destSize >= best.size, // current is at least as good — don't overwrite
  });
}

console.log(`Mode: ${APPLY ? 'APPLY (will copy)' : 'DRY-RUN (use --apply to copy)'}\n`);
console.log('Case        | DesktopCache               | Size      | LocalDest                     | LocalSize | Action');
console.log('------------|----------------------------|-----------|-------------------------------|-----------|--------');
for (const p of plan) {
  if (p.status === 'no-desktop-cache') {
    console.log(`${p.id.padEnd(12)}| (no cache under desktopCaseId)`);
    continue;
  }
  const action = p.skip ? 'SKIP (local ≥ desktop)' : (APPLY ? 'COPIED' : 'WOULD COPY');
  console.log(`${p.id.padEnd(12)}| ${p.desktopName.slice(0, 26).padEnd(26)} | ${String(p.desktopSize).padStart(9)} | ${p.destName.slice(0, 29).padEnd(29)} | ${String(p.destSize).padStart(9)} | ${action}`);
  if (APPLY && !p.skip) {
    copyFileSync(join(DESKTOP_CACHE_DIR, p.desktopName), join(DEST_DIR, p.destName));
  }
}
