#!/usr/bin/env node
// Reindex the debug KB: walks server/data/kb/, chunks the md files,
// embeds new/changed chunks via DashScope Qwen embedding v3, and writes
// server/data/kb-index.json. Incremental — reuses embeddings whose sha
// still matches.
//
// Usage:
//   node scripts/kb-reindex.mjs           # incremental
//   node scripts/kb-reindex.mjs --force   # re-embed everything

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkKbDir } from '../server/kb/chunker.js';
import { embedTexts } from '../server/kb/embedder.js';
import { reindex } from '../server/kb/store.js';
import 'dotenv/config';
// Some Bosch setups need HTTP proxy for the DashScope call.
import { configureLlmProxy, getLlmProxyUrl } from '../server/midscene/llm-proxy.js';

configureLlmProxy();
const proxy = getLlmProxyUrl();
if (proxy) console.log('[kb-reindex] proxy:', proxy);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const KB_DIR = path.join(__dirname, '..', 'server', 'data', 'kb');

const args = new Set(process.argv.slice(2));
const force = args.has('--force');

async function main() {
  const chunks = chunkKbDir(KB_DIR);
  console.log(`[kb-reindex] loaded ${chunks.length} chunks from ${KB_DIR}`);
  const embedFn = async (texts) => {
    console.log(`[kb-reindex] embedding ${texts.length} chunks…`);
    return embedTexts(texts);
  };
  const wrappedChunks = force
    ? chunks.map((c) => ({ ...c, __forceRehash: Math.random() }))
    : chunks;
  const index = await reindex(wrappedChunks, embedFn, { log: (m) => console.log('[kb-reindex]', m) });
  console.log(`[kb-reindex] done · ${index.chunks.length} chunks · dim=${index.dim} · model=${index.model}`);
}

main().catch((err) => {
  console.error('[kb-reindex] FAILED:', err);
  process.exit(1);
});
