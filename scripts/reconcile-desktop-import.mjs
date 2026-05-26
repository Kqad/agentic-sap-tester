// Reconcile saptest1 with the latest Desktop import manifest:
//   * Add/update cases listed in the manifest (delegated to import script).
//   * Delete any case JSON that was *previously* imported from Desktop
//     (source.desktop === true) but is NOT in the new manifest.
//   * Delete the cache files that belonged to those dropped cases.
//
// This is the safe path when the audit filter changes (e.g. we narrowed
// from "all cases with apiGuide" → "SAP TEST 1-8 only").

import { readFileSync, readdirSync, statSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CASES_DIR = path.join(ROOT, 'e2e', 'cases');
const CACHE_DIR = path.join(ROOT, 'midscene_run', 'cache');

const MANIFEST_PATH =
  process.argv[2] ??
  'C:\\Users\\BOG1SGH\\Desktop\\saptest\\saptest\\scripts\\saptest1-import-manifest.json';

if (!existsSync(MANIFEST_PATH)) {
  console.error(`Manifest not found: ${MANIFEST_PATH}`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const keepIds = new Set(manifest.cases.map((c) => c.id));

// Scan saptest1 cases. A case is "Desktop-imported" if its JSON has
// source.desktop === true (we stamped that in the import script).
let droppedCases = 0;
let droppedCacheFiles = 0;
const toDeleteCaseIds = [];

for (const entry of readdirSync(CASES_DIR)) {
  if (!entry.endsWith('.json')) continue;
  const file = path.join(CASES_DIR, entry);
  let body;
  try {
    body = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    continue;
  }
  if (!body?.source?.desktop) continue;
  const id = entry.replace(/\.json$/, '');
  if (keepIds.has(id)) continue;
  toDeleteCaseIds.push(id);
  unlinkSync(file);
  droppedCases += 1;
  console.log(`  - dropped case ${entry}  (title: ${body.title})`);
}

// Drop cache files whose embedded caseId belongs to a dropped case.
if (toDeleteCaseIds.length) {
  const drop = new Set(toDeleteCaseIds);
  for (const f of readdirSync(CACHE_DIR)) {
    const m = f.match(/^saptest-js-(.+?)-[0-9a-f]+\.cache\.yaml$/);
    if (!m) continue;
    if (!drop.has(m[1])) continue;
    unlinkSync(path.join(CACHE_DIR, f));
    droppedCacheFiles += 1;
  }
}

console.log(`Reconcile complete. Cases removed: ${droppedCases}. Cache files removed: ${droppedCacheFiles}.`);
