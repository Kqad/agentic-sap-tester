// Translate Chinese strings (from Midscene reports) to English via DashScope
// LLM, with a persistent JSON cache on disk. Ported from Desktop saptest's
// src/lib/translation.ts.
//
// Persistence: server/data/translations/zh-en.json (gitignored along with
// server/data/). The Desktop project's cache has been pre-seeded so common
// SAP test phrases never round-trip to the LLM.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { configureLlmProxy } from '../midscene/llm-proxy.js';
import { ROOT } from '../paths.js';

const CACHE_DIR = path.join(ROOT, 'server', 'data', 'translations');
const CACHE_FILE = path.join(CACHE_DIR, 'zh-en.json');
const MAX_BATCH = 12;
const MAX_STRING_LEN = 600;
const MODEL_TIMEOUT_MS = 60_000;
const MODEL_ATTEMPTS = 2;

const CHINESE_REGEX = /[一-鿿]/;
// `Tap - 进入 Menu` style prefixed lines: once we know the full string's
// English, we can derive the bare-Chinese suffix's translation for free —
// saves LLM round-trips later when the same phrase shows up without prefix.
const PREFIX_PATTERNS = [
  /^([A-Za-z][A-Za-z0-9 _-]{0,40}):\s+/,
  /^([A-Za-z][A-Za-z0-9 _-]{0,40})\s+-\s+/,
];

let cached = null;

function derivePrefixStrippedEntries(dict) {
  const derived = {};
  for (const [zh, en] of Object.entries(dict)) {
    for (const pattern of PREFIX_PATTERNS) {
      const zhMatch = zh.match(pattern);
      const enMatch = en.match(pattern);
      if (!zhMatch || !enMatch) continue;
      if (zhMatch[1].trim() !== enMatch[1].trim()) continue;
      const bareZh = zh.slice(zhMatch[0].length).trim();
      const bareEn = en.slice(enMatch[0].length).trim();
      if (!bareZh || !bareEn || bareZh === bareEn) continue;
      if (!CHINESE_REGEX.test(bareZh)) continue;
      if (dict[bareZh] || derived[bareZh]) continue;
      derived[bareZh] = bareEn;
    }
  }
  return derived;
}

function ensureCacheLoaded() {
  if (cached) return cached;
  if (!existsSync(CACHE_FILE)) { cached = {}; return cached; }
  try {
    const parsed = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const loaded = Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => typeof v === 'string'),
      );
      const derived = derivePrefixStrippedEntries(loaded);
      cached = { ...loaded, ...derived };
      if (Object.keys(derived).length > 0) persistCache(cached);
      return cached;
    }
  } catch { /* corrupt cache → start fresh */ }
  cached = {};
  return cached;
}

function persistCache(map) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(map, null, 2), 'utf8');
}

function chunkArray(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function stripCodeFence(content) {
  return content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function getTransConfig() {
  const apiKey = process.env.Trans_LLM_API_KEY
    || process.env.TRANS_LLM_API_KEY
    || process.env.YAML_LLM_API_KEY
    || process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.Trans_LLM_BASE_URL
    || process.env.TRANS_LLM_BASE_URL
    || process.env.YAML_LLM_BASE_URL
    || process.env.OPENAI_BASE_URL
    || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.Trans_LLM_MODEL
    || process.env.TRANS_LLM_MODEL
    || process.env.YAML_LLM_MODEL
    || process.env.OPENAI_MODEL
    || 'qwen-turbo';
  if (!apiKey) throw new Error('Translation: no API key in env (Trans_LLM_API_KEY / YAML_LLM_API_KEY / OPENAI_API_KEY).');
  return { apiKey, baseUrl, model };
}

async function callTranslationModelOnce(batch) {
  const { apiKey, baseUrl, model } = getTransConfig();
  configureLlmProxy();

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: [
              'You translate Chinese UI/automation strings into concise, natural English.',
              'Rules:',
              '- Preserve numbers, identifiers, ALL-CAPS codes (e.g. S_ALR_87011990), and punctuation positions.',
              '- Keep SAP field/button names recognizable (e.g. company code, Execute, List assets).',
              '- Do not add explanations or quotes; just translate.',
              '- If a string is already English or has no Chinese, return it unchanged.',
              '- Output ONLY a JSON object of the shape {"items": ["...", "..."]} matching the input length and order. No markdown.',
            ].join('\n'),
          },
          { role: 'user', content: JSON.stringify({ items: batch }) },
        ],
      }),
    });
  } catch (err) {
    throw new Error(`Translation fetch failed: ${err?.name ?? 'Error'}: ${err?.message ?? err}`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Translation model returned HTTP ${response.status}: ${detail.slice(0, 200)}`);
  }

  const json = await response.json();
  const rawContent = json?.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error('Translation model returned no content.');

  let parsed;
  try { parsed = JSON.parse(stripCodeFence(rawContent)); }
  catch { throw new Error(`Translation model returned non-JSON (first 200): ${rawContent.slice(0, 200)}`); }
  if (!Array.isArray(parsed.items) || parsed.items.length !== batch.length) {
    throw new Error(`Translation model returned ${Array.isArray(parsed.items) ? parsed.items.length : 'non-array'} items for batch of ${batch.length}.`);
  }

  return parsed.items.map((item, i) => {
    if (typeof item !== 'string') return batch[i];
    const trimmed = item.trim();
    return trimmed.length > 0 ? trimmed : batch[i];
  });
}

async function callTranslationModel(batch) {
  let lastError = null;
  for (let attempt = 1; attempt <= MODEL_ATTEMPTS; attempt += 1) {
    try { return await callTranslationModelOnce(batch); }
    catch (err) {
      lastError = err;
      console.warn(`[translation] attempt ${attempt}/${MODEL_ATTEMPTS} for batch of ${batch.length} failed: ${err?.message ?? err}`);
      if (attempt < MODEL_ATTEMPTS) await new Promise(r => setTimeout(r, 800));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Translation model call failed.');
}

/**
 * Translate Chinese strings to English. Returns ONLY the (zh → en) pairs for
 * the inputs that contained Chinese — strings that were already English or
 * had no Chinese are silently filtered out (callers fall back to original).
 *
 * Cache-first: any string already in zh-en.json is returned immediately.
 * Unknowns get batched (12 per LLM call), translated, persisted.
 */
export async function translateChineseToEnglish(strings) {
  const cache = ensureCacheLoaded();
  const out = {};
  const missing = [];
  const seen = new Set();

  for (const raw of strings) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > MAX_STRING_LEN) continue;
    if (!CHINESE_REGEX.test(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    if (cache[trimmed]) { out[trimmed] = cache[trimmed]; continue; }
    missing.push(trimmed);
  }

  if (missing.length === 0) return out;

  let mutated = false;
  let lastFailure = null;
  for (const batch of chunkArray(missing, MAX_BATCH)) {
    try {
      const translated = await callTranslationModel(batch);
      for (let i = 0; i < batch.length; i += 1) {
        const original = batch[i];
        const english = translated[i] ?? original;
        cache[original] = english;
        out[original] = english;
      }
      mutated = true;
    } catch (err) {
      lastFailure = err instanceof Error ? err : new Error(String(err));
      console.error(`[translation] batch of ${batch.length} skipped after retries: ${lastFailure.message}`);
    }
  }

  if (mutated) {
    const derived = derivePrefixStrippedEntries(cache);
    if (Object.keys(derived).length > 0) Object.assign(cache, derived);
    persistCache(cache);
  }

  if (Object.keys(out).length === 0 && lastFailure) throw lastFailure;
  return out;
}
