// Consume the manifest produced by Desktop\saptest\scripts\audit-cases-for-saptest1.mjs
// and:
//   1. write one JSON case file per Desktop case (preserving UUID as id, so
//      Midscene cache IDs `saptest-js-{caseId}-{hash}` keep matching);
//   2. copy that case's cache YAML files into saptest1/midscene_run/cache/.
//
// Re-runnable: writes always overwrite. Existing saptest1 cases with the same
// id (highly unlikely — UUIDs vs slug names) are replaced.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SAPTEST1_CASES = path.join(ROOT, 'e2e', 'cases');
const SAPTEST1_CACHE = path.join(ROOT, 'midscene_run', 'cache');

const MANIFEST_PATH =
  process.argv[2] ??
  'C:\\Users\\BOG1SGH\\Desktop\\saptest\\saptest\\scripts\\saptest1-import-manifest.json';
const SOURCE_CACHE_DIR =
  process.argv[3] ??
  'C:\\Users\\BOG1SGH\\Desktop\\saptest\\saptest\\midscene_run\\cache';

if (!existsSync(MANIFEST_PATH)) {
  console.error(`Manifest not found: ${MANIFEST_PATH}`);
  console.error(
    `Run first:  node scripts\\audit-cases-for-saptest1.mjs  (in Desktop\\saptest\\saptest)`,
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

mkdirSync(SAPTEST1_CASES, { recursive: true });
mkdirSync(SAPTEST1_CACHE, { recursive: true });

let casesWritten = 0;
let cacheCopied = 0;
let cacheMissing = 0;

for (const c of manifest.cases) {
  const body = {
    $schema:
      'Imported from Desktop\\saptest. Has apiGuide + matching cache (if cacheFiles non-empty).',
    title: c.title,
    description: c.description || '',
    sapUrl: c.targetUrl || '',
    transactionCode: deriveTransactionCode(c.naturalLanguage),
    naturalLanguage: c.naturalLanguage,
    apiGuide: c.apiGuide,
    apiGuideNaturalLanguage: c.apiGuideNaturalLanguage,
    yamlScript: c.yamlScript || '',
    tags: c.tags ?? [],
    source: {
      desktop: true,
      desktopCaseId: c.id,
      cacheFileCount: c.cacheFiles.length,
      importedAt: new Date().toISOString(),
    },
  };
  const outFile = path.join(SAPTEST1_CASES, `${c.id}.json`);
  writeFileSync(outFile, JSON.stringify(body, null, 2) + '\n', 'utf8');
  casesWritten += 1;

  for (const cf of c.cacheFiles) {
    const src = path.join(SOURCE_CACHE_DIR, cf);
    const dst = path.join(SAPTEST1_CACHE, cf);
    if (!existsSync(src)) {
      cacheMissing += 1;
      continue;
    }
    copyFileSync(src, dst);
    cacheCopied += 1;
  }
}

function deriveTransactionCode(nl) {
  if (!nl) return null;
  // Pull the value sent to the SAP "矩形输入框" command, e.g. S_ALR_87011990, /n/UI2/FLP, FBL1N
  const m = nl.match(/矩形输入框\s*输入\s*([A-Za-z0-9_/.]+)/);
  return m ? m[1] : null;
}

console.log('=== Import complete ===');
console.log(`Cases written:        ${casesWritten}`);
console.log(`Cache files copied:   ${cacheCopied}`);
console.log(`Cache files missing:  ${cacheMissing}`);
console.log(`Target cases dir:     ${SAPTEST1_CASES}`);
console.log(`Target cache dir:     ${SAPTEST1_CACHE}`);
