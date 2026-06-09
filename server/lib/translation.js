// Translate Chinese strings (from Midscene reports) to English.
// Default path: Youdao's free public translate endpoint (no API key,
// statistical model, ~hundreds of ms per call). LLM is only used as
// fallback if Youdao fails or returns garbage.
//
// Persistence: server/data/translations/zh-en.json (gitignored along with
// server/data/). The Desktop project's cache has been pre-seeded so common
// SAP test phrases never round-trip to any external service.

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

// Youdao public translate endpoint — no key required, returns immediately,
// no LLM round-trip. Parallelism is bounded to avoid the corp proxy choking
// on too many simultaneous CONNECT tunnels.
const YOUDAO_URL = 'https://aidemo.youdao.com/trans';
const YOUDAO_TIMEOUT_MS = 12_000;
const YOUDAO_PARALLEL = 6;
const YOUDAO_ATTEMPTS = 2;

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
    // undici's fetch wraps the real reason in err.cause. Without surfacing
    // it we'd only see "TypeError: fetch failed" and have no clue whether
    // it was DNS / proxy / TLS / timeout.
    const cause = err?.cause;
    const causeStr = cause
      ? ` (cause: ${cause?.code ?? cause?.name ?? ''} ${cause?.message ?? String(cause)})`
      : '';
    throw new Error(`Translation fetch failed: ${err?.name ?? 'Error'}: ${err?.message ?? err}${causeStr}`);
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
      console.warn(`[translation] LLM attempt ${attempt}/${MODEL_ATTEMPTS} for batch of ${batch.length} failed: ${err?.message ?? err}`);
      if (attempt < MODEL_ATTEMPTS) await new Promise(r => setTimeout(r, 800));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Translation model call failed.');
}

// Youdao's free translate endpoint — per-string fetch, no auth, instant.
// Returns null on failure (so the caller can fall back to LLM).
async function callYoudaoOnce(text) {
  configureLlmProxy();
  const url = `${YOUDAO_URL}?q=${encodeURIComponent(text)}&from=auto&to=en`;
  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(YOUDAO_TIMEOUT_MS),
    });
  } catch (err) {
    const cause = err?.cause;
    const causeStr = cause
      ? ` (cause: ${cause?.code ?? cause?.name ?? ''} ${cause?.message ?? String(cause)})`
      : '';
    throw new Error(`Youdao fetch failed: ${err?.message ?? err}${causeStr}`);
  }
  if (!response.ok) {
    throw new Error(`Youdao HTTP ${response.status}`);
  }
  const json = await response.json().catch(() => null);
  if (!json) throw new Error('Youdao returned non-JSON');
  if (json.errorCode && json.errorCode !== '0') {
    throw new Error(`Youdao errorCode=${json.errorCode}`);
  }
  // Response shape: { translation: ["..."], ... }
  const translated = Array.isArray(json.translation) ? json.translation[0] : null;
  if (typeof translated !== 'string' || !translated.trim()) {
    throw new Error('Youdao returned no translation');
  }
  return translated.trim();
}

async function callYoudaoWithRetry(text) {
  let lastError = null;
  for (let attempt = 1; attempt <= YOUDAO_ATTEMPTS; attempt += 1) {
    try { return await callYoudaoOnce(text); }
    catch (err) {
      lastError = err;
      if (attempt < YOUDAO_ATTEMPTS) await new Promise(r => setTimeout(r, 400));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Youdao failed.');
}

// Run a batch in parallel with bounded concurrency. Returns an array of
// the same length, with `null` slots for items Youdao couldn't translate
// (caller can fall back to LLM for those).
async function callYoudaoBatch(batch) {
  const out = new Array(batch.length).fill(null);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= batch.length) return;
      try { out[i] = await callYoudaoWithRetry(batch[i]); }
      catch { out[i] = null; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(YOUDAO_PARALLEL, batch.length) }, worker));
  return out;
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

  // For multi-line strings, splice them into per-line pieces so the
  // translator preserves line breaks (Youdao strips internal newlines
  // when given a multi-line input). We track each piece by parent string
  // so we can reassemble after translation.
  // `lineMap`: original-input → array of (line, missing-index-or-cachedEn).
  const lineMap = new Map();

  for (const raw of strings) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > MAX_STRING_LEN) continue;
    if (!CHINESE_REGEX.test(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    if (cache[trimmed]) { out[trimmed] = cache[trimmed]; continue; }

    // Multi-line? Split per line; translate each non-empty line that
    // contains Chinese. Blank lines and English-only lines pass through.
    if (/\r?\n/.test(trimmed)) {
      const lines = trimmed.split(/\r?\n/);
      const lineEntries = [];
      for (const line of lines) {
        const lineTrimmed = line.trim();
        if (!lineTrimmed) { lineEntries.push({ orig: line, en: line }); continue; }
        if (!CHINESE_REGEX.test(lineTrimmed)) { lineEntries.push({ orig: line, en: line }); continue; }
        if (cache[lineTrimmed]) {
          // preserve leading whitespace (indentation) on the rebuilt line
          const lead = line.match(/^\s*/)[0];
          lineEntries.push({ orig: line, en: lead + cache[lineTrimmed] });
          continue;
        }
        // Needs translation — queue the line itself.
        lineEntries.push({ orig: line, en: null, needLine: lineTrimmed });
        if (!seen.has(lineTrimmed)) {
          seen.add(lineTrimmed);
          missing.push(lineTrimmed);
        }
      }
      lineMap.set(trimmed, lineEntries);
      continue;
    }

    missing.push(trimmed);
  }

  if (missing.length === 0) return out;

  let mutated = false;
  let lastFailure = null;

  // 1. Pass: Youdao for the whole missing set (parallel, fast, no LLM).
  let youdaoResults = [];
  try {
    youdaoResults = await callYoudaoBatch(missing);
  } catch (err) {
    // Defensive — callYoudaoBatch swallows per-item errors already.
    console.warn(`[translation] Youdao batch threw: ${err?.message ?? err}`);
    youdaoResults = new Array(missing.length).fill(null);
  }
  const llmFallback = [];
  for (let i = 0; i < missing.length; i += 1) {
    const original = missing[i];
    const english = youdaoResults[i];
    if (typeof english === 'string' && english.trim()) {
      cache[original] = english;
      out[original] = english;
      mutated = true;
    } else {
      llmFallback.push(original);
    }
  }
  if (missing.length > 0) {
    const hit = missing.length - llmFallback.length;
    console.log(`[translation] Youdao ${hit}/${missing.length} ok, ${llmFallback.length} need LLM fallback`);
  }

  // 2. Pass: LLM only for the strings Youdao couldn't handle (rare path).
  for (const batch of chunkArray(llmFallback, MAX_BATCH)) {
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
      console.error(`[translation] LLM fallback batch of ${batch.length} skipped: ${lastFailure.message}`);
    }
  }

  // Reassemble multi-line originals by stitching the per-line translations
  // back together with the original newlines + indentation.
  for (const [original, entries] of lineMap) {
    const rebuilt = entries.map(({ orig, en, needLine }) => {
      if (en != null) return en;
      const translated = cache[needLine];
      if (translated) {
        const lead = orig.match(/^\s*/)[0];
        return lead + translated;
      }
      return orig; // fall back to original line if translation failed
    }).join('\n');
    out[original] = rebuilt;
    if (rebuilt !== original) {
      cache[original] = rebuilt;
      mutated = true;
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
