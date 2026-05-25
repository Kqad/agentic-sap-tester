import { test as base } from '@playwright/test';
import type { PlayWrightAiFixtureType } from '@midscene/web/playwright';
import { PlaywrightAiFixture } from '@midscene/web/playwright';

// Midscene cache replay:
//   * MIDSCENE_CACHE=1  → enable cache (default strategy: read-write).
//     On success the AI plan + located xpaths are persisted to
//     midscene_run/cache/<spec>(<test>).cache.yaml; next time the same
//     prompt is hit, Midscene replays from cache and skips the AI call.
//   * MIDSCENE_CACHE_STRATEGY=read-only|read-write|write-only — optional override.
//       - read-write (default): replay if hit, refresh on miss
//       - read-only: replay only; never touches the file
//       - write-only: ignore existing cache, always re-record (use after UI changes)
//
// Stale cache entries fall back to a fresh AI call automatically — replay is
// non-destructive. Clear individual caches via the web UI or by deleting the
// corresponding .cache.yaml file.
const rawCacheFlag = String(process.env.MIDSCENE_CACHE ?? '').toLowerCase();
const cacheEnabled = rawCacheFlag === '1' || rawCacheFlag === 'true' || rawCacheFlag === 'yes';
const cacheStrategy = process.env.MIDSCENE_CACHE_STRATEGY as
  | 'read-only' | 'read-write' | 'write-only' | undefined;

const cacheOption = cacheEnabled
  ? (cacheStrategy ? { strategy: cacheStrategy } : true)
  : undefined;

export const test = base.extend<PlayWrightAiFixtureType>(
  PlaywrightAiFixture({
    waitForNetworkIdleTimeout: 20_000,
    waitForNavigationTimeout: 30_000,
    cache: cacheOption,
  }),
);

export { expect } from '@playwright/test';
