// Retriever: cosine similarity over the KB vector store + metadata
// filter + keyword boost. For our KB scale (dozens → low thousands of
// chunks) a linear scan is trivially fast; no vector DB needed.
//
// query flow:
//   1. Optional metadata filter (tag set, scope) narrows candidate list
//   2. Cosine sim over survivors (all embeddings pre-normalized on load)
//   3. Cheap BM25-ish keyword boost — if the query contains a rare
//      keyword and the chunk contains it too, nudge the score up.
//      Helps "ap-report" / "AS01" / "OK Code" type exact hits that
//      dense embeddings can miss.
//   4. Return top-k

import { loadIndex } from './store.js';
import { embedOne, l2normalize } from './embedder.js';

let _index = null;
export function refreshIndex() { _index = loadIndex(); return _index; }
export function ensureIndex() { if (!_index) _index = loadIndex(); return _index; }

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}

function anyTagMatches(chunkTags, filterTags) {
  if (!filterTags?.length) return true;
  if (!chunkTags?.length) return false;
  const set = new Set((chunkTags || []).map((t) => String(t).toLowerCase()));
  return filterTags.some((t) => set.has(String(t).toLowerCase()));
}

// Extract 2-4 char alphanumeric tokens (SAP T-codes, error keywords)
// from the query. These are the tokens dense embeddings under-weight.
function extractRareKeywords(query) {
  const out = new Set();
  const re = /\b[A-Z][A-Z0-9]{2,7}\b/g;
  let m;
  while ((m = re.exec(query || '')) !== null) out.add(m[0]);
  // Also grab common English snake-case identifiers like "not_found"
  const re2 = /\b[a-z]{3,}(?:[_-][a-z]{2,}){1,3}\b/g;
  while ((m = re2.exec(query || '')) !== null) out.add(m[0]);
  return [...out];
}

function keywordBoost(chunkText, keywords) {
  if (!keywords.length) return 0;
  const hay = String(chunkText || '').toLowerCase();
  let hits = 0;
  for (const kw of keywords) if (hay.includes(kw.toLowerCase())) hits += 1;
  // Up to +0.08 per hit — 3-4 hits move a mid-relevance chunk to top.
  return Math.min(0.32, hits * 0.08);
}

// Public: run a query.
//   query:  string
//   opts:
//     k:       top-k (default 5)
//     tags:    array of tag filter (OR semantics)
//     scope:   'general' / 'failure-mode' / etc (matches meta.scope)
//     hypothesis: 'locator' / 'timing' / etc — if set, prepended to
//                 query embed input so retrieval leans that direction
export async function retrieve(query, opts = {}) {
  const idx = ensureIndex();
  if (!idx || !idx.chunks?.length) return { hits: [], reason: 'index empty' };
  const k = Math.max(1, Math.min(20, opts.k || 5));

  // Filter first
  const candidates = idx.chunks.filter((c) => {
    if (opts.scope && c.meta?.scope !== opts.scope) return false;
    if (opts.tags?.length && !anyTagMatches(c.meta?.tags, opts.tags)) return false;
    return true;
  });
  if (!candidates.length) return { hits: [], reason: 'no candidates after filter' };

  const qText = opts.hypothesis
    ? `hypothesis: ${opts.hypothesis}\n${query}`
    : query;
  const qVec = await embedOne(qText);
  const qN = l2normalize(qVec);

  const kws = extractRareKeywords(query);
  const scored = candidates.map((c) => {
    const base = dot(qN, c._n);
    const boost = keywordBoost(c.text, kws);
    return { chunk: c, score: base + boost, base, boost };
  });
  scored.sort((a, b) => b.score - a.score);
  const hits = scored.slice(0, k).map((s) => ({
    title: s.chunk.title,
    section: s.chunk.section,
    relPath: s.chunk.relPath,
    text: s.chunk.text,
    tags: s.chunk.meta?.tags || [],
    scope: s.chunk.meta?.scope || 'other',
    tool: s.chunk.meta?.tool || null,
    score: Number(s.score.toFixed(4)),
    base: Number(s.base.toFixed(4)),
    boost: Number(s.boost.toFixed(4)),
  }));
  return { hits, candidateCount: candidates.length, keywords: kws };
}
