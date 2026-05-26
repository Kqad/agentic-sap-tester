// Consolidate the 8 SAP TEST cases into clean saptest1..saptest8 files,
// pulling each piece from its canonical source:
//
//   * naturalLanguage  ← Desktop SQLite snapshot (matches what the apiGuide
//                        + cache were recorded against — preserves cache).
//   * apiGuide         ← Desktop SQLite snapshot (verbatim).
//   * yamlScript       ← Desktop SQLite snapshot (verbatim).
//   * jsSource         ← the user's original SAP TEST N.txt JS section
//                        (verbatim, hand-written, NOT the auto-generated
//                        apiGuide.steps[].exampleCode).
//   * title / desc /
//     transactionCode  ← Desktop snapshot (so existing UI hints stay sane).
//
// We also migrate the ONE cache file (per case) that matches Desktop's
// current apiGuide hash. After rewriting the internal `cacheId:` field
// to point at the new saptest{N} caseId, Run JS w/ Cache hits identically
// to before. Orphan cache files (older apiGuide revisions) are deleted —
// they were already useless under the UUID name. The old UUID case JSONs
// and the sap-stabilized-NN JSONs are removed since the saptest{N} files
// supersede them.

import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CASES_DIR = path.join(ROOT, 'e2e', 'cases');
const CACHE_DIR = path.join(ROOT, 'midscene_run', 'cache');
const TXT_DIR = path.join(
  ROOT, 'SAP TEST DEMO 5.21 1', 'SAP TEST DEMO 5.21',
);

const MANIFEST_PATH =
  process.argv[2] ??
  'C:\\Users\\BOG1SGH\\Desktop\\saptest\\saptest\\scripts\\saptest1-8-export.json';
const SOURCE_CACHE_DIR =
  process.argv[3] ??
  'C:\\Users\\BOG1SGH\\Desktop\\saptest\\saptest\\midscene_run\\cache';

if (!existsSync(MANIFEST_PATH)) {
  console.error(`Manifest not found: ${MANIFEST_PATH}`);
  console.error('Run Desktop\\saptest\\scripts\\export-sap1-8-for-saptest1.mjs first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

mkdirSync(CASES_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

// ── Step 1: parse .txt files for jsSource per N ────────────────────────
function parseTxtJsSource(n) {
  const file = path.join(TXT_DIR, `SAP test ${n} 自然语言+JS.txt`);
  if (!existsSync(file)) return '';
  const raw = readFileSync(file, 'utf8');
  const m = raw.split(/\n\s*JS\s*[：:；;]/);
  return (m[1] ?? '').trim();
}

// ── Step 2: cacheId formula (must match server/midscene/cache-id.js) ──
function buildCacheId(caseId, naturalLanguage, apiGuide) {
  const hash = createHash('sha1')
    .update(String(caseId))
    .update(String(naturalLanguage ?? ''))
    .update(JSON.stringify(apiGuide ?? null))
    .digest('hex')
    .slice(0, 12);
  return `saptest-js-${caseId}-${hash}`;
}

// ── Step 3: write saptest{N}.json + migrate cache file ────────────────
let casesWritten = 0;
let cacheMigrated = 0;
let cacheMissing = 0;
const migratedCases = [];

for (const c of manifest.cases) {
  const N = c.targetN;
  const newCaseId = `saptest${N}`;
  const jsSource = parseTxtJsSource(N);

  const body = {
    $schema: `SAP TEST ${N} — consolidated from Desktop SQLite + original SAP test ${N} 自然语言+JS.txt`,
    title: c.title,
    description: c.description ?? '',
    sapUrl: c.targetUrl ?? '',
    transactionCode: deriveTx(c.naturalLanguage),
    naturalLanguage: c.naturalLanguage ?? '',
    jsSource,
    apiGuide: c.apiGuide,
    apiGuideNaturalLanguage: c.apiGuideNaturalLanguage ?? '',
    yamlScript: c.yamlScript ?? '',
    tags: c.tags ?? [],
    source: {
      desktop: true,
      desktopCaseId: c.desktopCaseId,
      consolidatedAt: new Date().toISOString(),
      txtSource: `SAP TEST DEMO 5.21 1/SAP TEST DEMO 5.21/SAP test ${N} 自然语言+JS.txt`,
    },
  };

  const newPath = path.join(CASES_DIR, `${newCaseId}.json`);
  writeFileSync(newPath, JSON.stringify(body, null, 2) + '\n', 'utf8');
  casesWritten += 1;

  // Cache migration: copy the ONE matching file, rewrite internal cacheId.
  const newCacheId = buildCacheId(newCaseId, body.naturalLanguage, body.apiGuide);
  const newCacheFile = `${newCacheId}.cache.yaml`;
  const newCachePath = path.join(CACHE_DIR, newCacheFile);

  if (c.desktop.cacheExists) {
    const srcCachePath = path.join(SOURCE_CACHE_DIR, c.desktop.cacheFile);
    if (existsSync(srcCachePath)) {
      let yaml = readFileSync(srcCachePath, 'utf8');
      // Rewrite the `cacheId: saptest-js-{uuid}-{hash}` line at the top of
      // the file so Midscene's cache layer sees its own id (it sanity-checks
      // this against the requested cacheId on load).
      yaml = yaml.replace(
        /^cacheId:\s*.+$/m,
        `cacheId: ${newCacheId}`,
      );
      writeFileSync(newCachePath, yaml, 'utf8');
      cacheMigrated += 1;
    } else {
      cacheMissing += 1;
      console.warn(`  ⚠ cache file vanished mid-flight: ${c.desktop.cacheFile}`);
    }
  } else {
    cacheMissing += 1;
  }

  migratedCases.push({
    N,
    newCaseId,
    oldCaseId: c.desktopCaseId,
    newCacheId,
    cacheMigrated: c.desktop.cacheExists,
    orphans: c.desktop.orphanCacheFiles.length,
  });
}

// ── Step 4: cleanup old files ─────────────────────────────────────────
let deletedJson = 0;
let deletedCache = 0;

const desktopCaseIds = new Set(manifest.cases.map((c) => c.desktopCaseId));
for (const name of readdirSync(CASES_DIR)) {
  if (!name.endsWith('.json')) continue;
  const stem = name.replace(/\.json$/, '');
  if (desktopCaseIds.has(stem) || /^sap-stabilized-\d{2}$/.test(stem)) {
    unlinkSync(path.join(CASES_DIR, name));
    deletedJson += 1;
  }
}

// Drop every cache file whose embedded case ID is one of the old UUIDs.
const ridPattern = new RegExp(
  '^saptest-js-(?:' +
    [...desktopCaseIds].map((id) => id.replace(/-/g, '\\-')).join('|') +
    ')-',
);
for (const name of readdirSync(CACHE_DIR)) {
  if (!name.endsWith('.cache.yaml')) continue;
  if (ridPattern.test(name)) {
    unlinkSync(path.join(CACHE_DIR, name));
    deletedCache += 1;
  }
}

console.log('=== Consolidation complete ===');
console.log(`Cases written : ${casesWritten} (saptest1.json .. saptest8.json)`);
console.log(`Cache migrated: ${cacheMigrated} (1 file per case, internal cacheId rewritten)`);
console.log(`Cache missing : ${cacheMissing} (cases where Desktop had no current cache match)`);
console.log(`Old JSONs dropped : ${deletedJson}`);
console.log(`Old cache files dropped: ${deletedCache}`);
console.log('');
console.table(migratedCases);

function deriveTx(nl) {
  if (!nl) return null;
  const m = nl.match(/矩形输入框\s*输入\s*([A-Za-z0-9_/.]+)/);
  return m ? m[1] : null;
}
