// Qwen embedding v3 via DashScope-compatible OpenAI endpoint. Uses the
// same base URL / API key our other LLM calls use — reads them straight
// from env so this module doesn't depend on express req context.
//
// The DashScope `text-embedding-v3` model:
//   - 1024-dim vectors
//   - up to 8192 tokens per input
//   - batches up to 25 inputs per call
//
// If MIDSCENE_MODEL_BASE_URL is set to a chat-only proxy (some Bosch
// setups do that), the embed URL falls back to DashScope direct via
// EMBED_BASE_URL. Configure at bootstrap time.

const DEFAULT_MODEL = 'text-embedding-v3';
// DashScope caps at 10 per call (as of 2026 — earlier the docs said 25).
const BATCH_SIZE = 10;

function pickConfig() {
  const baseUrl = process.env.EMBED_BASE_URL
    || process.env.YAML_LLM_BASE_URL
    || process.env.MIDSCENE_MODEL_BASE_URL
    || '';
  const apiKey = process.env.EMBED_API_KEY
    || process.env.YAML_LLM_API_KEY
    || process.env.MIDSCENE_MODEL_API_KEY
    || '';
  const model = process.env.EMBED_MODEL || DEFAULT_MODEL;
  return { baseUrl, apiKey, model };
}

// Call the embeddings endpoint once for a batch of ≤25 inputs. Returns
// an array of Float32Arrays (one per input, in the same order).
async function embedBatch(inputs) {
  const { baseUrl, apiKey, model } = pickConfig();
  if (!baseUrl || !apiKey) throw new Error('EMBED_BASE_URL / EMBED_API_KEY not configured');
  const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: inputs }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`embed HTTP ${resp.status}: ${text.slice(0, 400)}`);
  }
  const data = await resp.json();
  if (!Array.isArray(data.data)) throw new Error('embed response missing .data[]');
  // DashScope returns items already in the order of `input`.
  return data.data
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((d) => Float32Array.from(d.embedding));
}

// Public: embed an array of text strings. Batches internally.
export async function embedTexts(texts) {
  const out = new Array(texts.length);
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const slice = texts.slice(i, i + BATCH_SIZE);
    const vecs = await embedBatch(slice);
    for (let j = 0; j < vecs.length; j += 1) out[i + j] = vecs[j];
  }
  return out;
}

// Public: embed a single string. Thin wrapper.
export async function embedOne(text) {
  const [v] = await embedTexts([text]);
  return v;
}

// L2-normalize a vector so cosine similarity becomes a simple dot product.
export function l2normalize(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i += 1) sum += v[i] * v[i];
  const n = Math.sqrt(sum) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i += 1) out[i] = v[i] / n;
  return out;
}
