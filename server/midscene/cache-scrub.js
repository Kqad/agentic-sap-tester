// Strip scroll-class entries from a Midscene cache YAML so scroll steps
// always re-plan via the LLM (no stale xpath replay). Per user request:
// "aiScroll didn't move — don't go through cache for it, ONLY scroll bypasses
// cache". Other locate/plan entries are kept so Run JS w/ Cache still
// short-circuits aiTap / aiInput / aiQuery / aiAssert.
//
// We avoid pulling in a YAML parser. The Midscene cache format is well
// constrained: top-level `midsceneVersion`, `cacheId`, then a `caches:`
// array of `- type: locate|plan` blocks at column 2. We split on those
// block boundaries, regex out each block's `prompt:`, drop the block if
// it's scroll-related, and re-assemble verbatim.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Prompts considered "scroll class" — both plan-level NL instructions and
// locate-level element descriptions that name a scrollbar or extreme edge.
const SCROLL_PROMPT_PATTERN =
  /滚动条|滑块|scrollbar|scroll\s*bar|滑动|滚动|滚轮|拖到|拖动|drag|最[上下左右顶底](?:端|侧|边|方|部|位置|处)?|rightmost|leftmost|topmost|bottommost|bottom\s*end|top\s*end|right\s*end|left\s*end/i;

function isScrollEntry(blockText) {
  // First non-empty `prompt:` line in the block (handles "prompt: foo" and
  // "prompt: |\n  foo"). Match through end of line.
  const inline = blockText.match(/^\s*prompt:\s*(.+?)\s*$/m);
  if (inline?.[1]) {
    const v = inline[1].replace(/^['"]|['"]$/g, '');
    if (SCROLL_PROMPT_PATTERN.test(v)) return true;
  }
  // Block-style scalar prompt: |  …  →  read first indented content line.
  const blockScalar = blockText.match(/^\s*prompt:\s*[|>][^\n]*\n([\s\S]*?)(?=\n\s{0,4}(?:cache|yamlWorkflow|prompt|type):|\n\s*-\s*type:|$)/m);
  if (blockScalar?.[1]) {
    const first = blockScalar[1].split('\n').map((l) => l.trim()).find((l) => l) ?? '';
    if (SCROLL_PROMPT_PATTERN.test(first)) return true;
  }
  return false;
}

/**
 * Scrub scroll entries from a cache YAML file in place.
 * @param {string} cacheFilePath
 * @returns {{ kept: number, removed: number } | null}  null if file missing
 */
export function stripScrollCacheEntries(cacheFilePath) {
  if (!existsSync(cacheFilePath)) return null;
  const text = readFileSync(cacheFilePath, 'utf8');
  // Header (everything up to and including the `caches:` line) stays as-is.
  const headerMatch = text.match(/^([\s\S]*?\bcaches:\s*\n)/);
  if (!headerMatch) {
    // No caches block — nothing to scrub.
    return { kept: 0, removed: 0 };
  }
  const header = headerMatch[1];
  const tail = text.slice(header.length);

  // Locate each entry start (line starting with `  - type:`). Use a
  // non-lookahead pattern so re.lastIndex always advances — a zero-length
  // lookahead match here would loop forever and blow the array length.
  const re = /^\s{0,4}-\s+type:/gm;
  const positions = [];
  let m;
  while ((m = re.exec(tail)) !== null) {
    positions.push(m.index);
  }
  if (positions.length === 0) return { kept: 0, removed: 0 };

  const blocks = [];
  for (let i = 0; i < positions.length; i += 1) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : tail.length;
    blocks.push(tail.slice(start, end));
  }
  // Anything BEFORE positions[0] is just whitespace after the `caches:` line.
  const preamble = tail.slice(0, positions[0]);

  const kept = [];
  let removed = 0;
  for (const block of blocks) {
    if (isScrollEntry(block)) {
      removed += 1;
    } else {
      kept.push(block);
    }
  }

  const next = header + preamble + kept.join('');
  if (removed > 0) {
    writeFileSync(cacheFilePath, next, 'utf8');
  }
  return { kept: kept.length, removed };
}

/**
 * Strip cache entries whose `prompt:` field is in `promptsToRemove`.
 * Used for per-step "bypass cache" — the runner deletes targeted entries
 * before the run so Midscene cache-misses on those locators and re-LLMs.
 *
 * @param {string} cacheFilePath
 * @param {Set<string>} promptsToRemove  set of locator strings to drop
 * @returns {{ kept: number, removed: number, matchedPrompts: string[] } | null}
 *          null when file missing; matchedPrompts lists which prompts in the
 *          set actually had an entry (lets callers detect typos / silent
 *          misses).
 */
export function stripCacheEntriesByPrompt(cacheFilePath, promptsToRemove) {
  if (!existsSync(cacheFilePath)) return null;
  if (!(promptsToRemove instanceof Set) || promptsToRemove.size === 0) {
    return { kept: 0, removed: 0, matchedPrompts: [] };
  }
  const text = readFileSync(cacheFilePath, 'utf8');
  const headerMatch = text.match(/^([\s\S]*?\bcaches:\s*\n)/);
  if (!headerMatch) return { kept: 0, removed: 0, matchedPrompts: [] };
  const header = headerMatch[1];
  const tail = text.slice(header.length);

  const re = /^\s{0,4}-\s+type:/gm;
  const positions = [];
  let m;
  while ((m = re.exec(tail)) !== null) positions.push(m.index);
  if (positions.length === 0) return { kept: 0, removed: 0, matchedPrompts: [] };

  const blocks = [];
  for (let i = 0; i < positions.length; i += 1) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : tail.length;
    blocks.push(tail.slice(start, end));
  }
  const preamble = tail.slice(0, positions[0]);

  const kept = [];
  let removed = 0;
  const matchedPrompts = new Set();
  for (const block of blocks) {
    const inline = block.match(/^\s*prompt:\s*(.+?)\s*$/m);
    const prompt = inline?.[1]?.replace(/^['"]|['"]$/g, '') ?? null;
    if (prompt && promptsToRemove.has(prompt)) {
      removed += 1;
      matchedPrompts.add(prompt);
    } else {
      kept.push(block);
    }
  }

  const next = header + preamble + kept.join('');
  if (removed > 0) writeFileSync(cacheFilePath, next, 'utf8');
  return { kept: kept.length, removed, matchedPrompts: [...matchedPrompts] };
}
