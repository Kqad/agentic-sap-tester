// Port of Desktop\saptest\src\lib\sap-template-cache.ts.
//
// When a NEW case is created, if SAPTEST_TEMPLATE_CASE_ID env var points to
// an existing case with apiGuide + cache, copy that case's latest cache file
// over to the new case's cacheId path. This means the new case can run
// "Run JS w/ Cache" immediately for any steps whose locators happen to match
// the template (commonly the SAP login / menu navigation early steps).
//
// Differences from Desktop:
//   - cases here are JSON files in e2e/cases/, not SQLite rows
//   - cacheId hash is v4c (locator-only, sleep filtered, tcode separated)
//   - We rewrite the cacheId line inside the YAML so cache replays work
//     correctly under the new id (Midscene checks this against runtime).

import {
  existsSync, readdirSync, readFileSync, statSync,
} from 'node:fs';
import path from 'node:path';
import { CASES_DIR } from '../paths.js';
import {
  buildJavascriptCacheId,
  copyCacheFileForId,
  resolveCachePath,
  resolveSlotCacheId,
  resolveSlotCachePath,
} from './cache-id.js';

// Find the newest saptest-js-<templateId>-*.cache.yaml on disk (any hash).
// Used as fallback when the template's CURRENT apiGuide hash doesn't have
// a recorded cache file (e.g. user edited template apiGuide but never re-ran).
function findLatestCacheForCase(templateCaseId) {
  const cacheDir = path.dirname(resolveCachePath('placeholder'));
  if (!existsSync(cacheDir)) return null;
  const prefix = `saptest-js-${templateCaseId}-`;
  const candidates = readdirSync(cacheDir)
    .filter((n) => n.startsWith(prefix) && n.endsWith('.cache.yaml'))
    .map((n) => ({ full: path.join(cacheDir, n), mtimeMs: statSync(path.join(cacheDir, n)).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0]?.full ?? null;
}

function loadCaseObj(id) {
  const file = path.join(CASES_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  try {
    return { id, ...JSON.parse(readFileSync(file, 'utf8')) };
  } catch {
    return null;
  }
}

// Copy template cache to new case's cacheId path, rewriting the internal
// `cacheId: ...` line so Midscene's runtime sanity check passes. Returns
// { copied: boolean, reason?: string, targetPath?: string }.
export function ensureTemplateCacheForCase(targetCase) {
  const templateCaseId = (process.env.SAPTEST_TEMPLATE_CASE_ID ?? '').trim();
  if (!templateCaseId) return { copied: false, reason: 'SAPTEST_TEMPLATE_CASE_ID not set' };
  if (templateCaseId === targetCase.id) return { copied: false, reason: 'target is the template itself' };
  if (!targetCase.apiGuide?.steps?.length) return { copied: false, reason: 'target has no apiGuide yet' };

  const template = loadCaseObj(templateCaseId);
  if (!template || !template.apiGuide?.steps?.length) {
    return { copied: false, reason: `template case "${templateCaseId}" not found or has no apiGuide` };
  }

  // Resolve the template's cache file. Prefer the current pass slot, then
  // the legacy base file, then the most recently modified file for that case.
  const templateCacheId = buildJavascriptCacheId(template);
  let templateCachePath = resolveSlotCachePath(templateCacheId, 'pass');
  if (!existsSync(templateCachePath)) {
    templateCachePath = resolveCachePath(templateCacheId);
  }
  if (!existsSync(templateCachePath)) {
    templateCachePath = findLatestCacheForCase(template.id);
    if (!templateCachePath) {
      return { copied: false, reason: 'template cache file missing (no fallback)' };
    }
  }

  const newBaseCacheId = buildJavascriptCacheId(targetCase);
  const newCacheId = resolveSlotCacheId(newBaseCacheId, 'pass');
  const newCachePath = resolveCachePath(newCacheId);
  if (existsSync(newCachePath)) {
    return { copied: false, reason: 'target cache already exists (not overwritten)' };
  }

  copyCacheFileForId(templateCachePath, newCachePath, newCacheId);
  return { copied: true, targetPath: newCachePath, sourcePath: templateCachePath };
}
