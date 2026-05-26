// For every Desktop-imported case, compute the current cacheId and check
// whether the matching cache file exists. Surfaces orphaned cache files
// (cache present but doesn't match current apiGuide hash → unusable) and
// missing-current entries (no cache file for the current hash at all).

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CASES_DIR = path.join(ROOT, 'e2e', 'cases');
const CACHE_DIR = path.join(ROOT, 'midscene_run', 'cache');

function buildJavascriptCacheId(c) {
  const hash = createHash('sha1')
    .update(String(c.id))
    .update(String(c.naturalLanguage ?? ''))
    .update(JSON.stringify(c.apiGuide ?? null))
    .digest('hex')
    .slice(0, 12);
  return `saptest-js-${c.id}-${hash}`;
}

const allCacheFiles = readdirSync(CACHE_DIR).filter((f) => f.endsWith('.cache.yaml'));

for (const name of readdirSync(CASES_DIR)) {
  if (!name.endsWith('.json')) continue;
  const id = name.replace(/\.json$/, '');
  const body = JSON.parse(readFileSync(path.join(CASES_DIR, name), 'utf8'));
  if (!body?.source?.desktop) continue;
  const caseObj = { id, naturalLanguage: body.naturalLanguage, apiGuide: body.apiGuide };
  const currentCacheId = buildJavascriptCacheId(caseObj);
  const currentFile = `${currentCacheId}.cache.yaml`;
  const matchesCurrent = existsSync(path.join(CACHE_DIR, currentFile));

  // All cache files for this case (regardless of hash)
  const prefix = `saptest-js-${id}-`;
  const allForCase = allCacheFiles.filter((f) => f.startsWith(prefix));

  // Was the apiGuide possibly stale at import time? Desktop carries both
  // the current NL and the NL that produced the apiGuide.
  const apiGuideNL = body.apiGuideNaturalLanguage ?? '';
  const apiGuideMatchesNL = String(apiGuideNL).trim() === String(body.naturalLanguage ?? '').trim();

  console.log(`\n=== ${body.title} (${id.slice(0, 8)}…) ===`);
  console.log(`  current cacheId : ${currentCacheId}`);
  console.log(`  current file    : ${currentFile} — ${matchesCurrent ? 'PRESENT ✓' : 'MISSING ✗'}`);
  console.log(`  cache files     : ${allForCase.length} total`);
  for (const f of allForCase) {
    const isCurrent = f === currentFile;
    console.log(`    ${isCurrent ? '⮕' : ' '} ${f}`);
  }
  console.log(`  apiGuide NL == current NL? ${apiGuideMatchesNL ? 'YES' : 'NO (apiGuide may be stale)'}`);
  if (!apiGuideMatchesNL) {
    console.log(`    current NL  : ${String(body.naturalLanguage ?? '').slice(0, 90).replace(/\n/g, ' ')}…`);
    console.log(`    apiGuide NL : ${String(apiGuideNL).slice(0, 90).replace(/\n/g, ' ')}…`);
  }
}
