// KB vector store — a single JSON file holding all chunks + their
// embeddings + metadata. In-memory cosine search over the whole array
// on read. For the ~50 chunks we start with this is trivially fast;
// stays fine up to a few thousand chunks (single-digit ms per query).
//
// File shape (server/data/kb-index.json):
//   {
//     "version": 1,
//     "model":   "text-embedding-v3",
//     "dim":     1024,
//     "generatedAt": "ISO",
//     "chunks": [
//       { id, title, section, text, relPath, meta, sha, embedding: [floats] }
//     ]
//   }
//
// The `sha` field lets `reindex` detect chunks that haven't changed and
// skip the embed call for them — incremental reindex.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { l2normalize } from './embedder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
export const INDEX_PATH = path.join(__dirname, '..', 'data', 'kb-index.json');

export function chunkSha(chunk) {
  const h = crypto.createHash('sha1');
  h.update(chunk.relPath || '');
  h.update('\0');
  h.update(chunk.section || '');
  h.update('\0');
  h.update(chunk.text || '');
  return h.digest('hex').slice(0, 12);
}

// Loads the index into memory. Missing / invalid → returns empty.
export function loadIndex() {
  try {
    const raw = fs.readFileSync(INDEX_PATH, 'utf8');
    const data = JSON.parse(raw);
    // Normalize embeddings ONCE on load so retrieval is a pure dot product.
    for (const c of data.chunks || []) {
      if (c.embedding && !c._n) {
        c._n = l2normalize(Float32Array.from(c.embedding));
      }
    }
    return data;
  } catch { return null; }
}

// Persist. Strips the runtime `_n` cache before write (rebuilt on load).
export function saveIndex(index) {
  const slim = {
    ...index,
    chunks: index.chunks.map(({ _n, ...rest }) => rest),
  };
  const dir = path.dirname(INDEX_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(slim, null, 2), 'utf8');
}

// Merge new chunks into an existing index — reuse embeddings for chunks
// whose sha matches (unchanged), embed only the new/edited ones.
// `embedFn(texts) → Promise<Float32Array[]>`
export async function reindex(freshChunks, embedFn, opts = {}) {
  const old = loadIndex();
  const oldBySha = new Map();
  if (old && Array.isArray(old.chunks)) {
    for (const c of old.chunks) oldBySha.set(c.sha, c);
  }
  const enriched = freshChunks.map((c) => ({ ...c, sha: chunkSha(c) }));
  const needsEmbed = [];
  for (const c of enriched) {
    if (!oldBySha.has(c.sha)) needsEmbed.push(c);
  }
  if (opts.log) opts.log(`reindex: ${enriched.length} chunks total · ${needsEmbed.length} need embedding · ${enriched.length - needsEmbed.length} reused`);
  if (needsEmbed.length) {
    const vectors = await embedFn(needsEmbed.map((c) => embedInputFor(c)));
    for (let i = 0; i < needsEmbed.length; i += 1) {
      needsEmbed[i].embedding = Array.from(vectors[i]);
    }
  }
  const now = enriched.map((c, i) => {
    if (c.embedding) return {
      id: c.sha, title: c.title, section: c.section, text: c.text,
      relPath: c.relPath, meta: c.meta, sha: c.sha, embedding: c.embedding,
    };
    const reused = oldBySha.get(c.sha);
    return {
      id: c.sha, title: c.title, section: c.section, text: c.text,
      relPath: c.relPath, meta: c.meta, sha: c.sha,
      embedding: reused.embedding,
    };
  });
  const dim = now[0]?.embedding?.length || 0;
  const index = {
    version: 1,
    model: process.env.EMBED_MODEL || 'text-embedding-v3',
    dim,
    generatedAt: new Date().toISOString(),
    chunks: now,
  };
  saveIndex(index);
  return index;
}

// Compose the exact text we send to the embedder. Titles + section
// headings help retrieval — a chunk about "T Code field" whose text
// doesn't repeat the word T-code every sentence still matches a query
// mentioning T-code via the heading.
export function embedInputFor(chunk) {
  const heading = [chunk.title, chunk.section].filter(Boolean).join(' · ');
  return `${heading}\n\n${chunk.text}`;
}
