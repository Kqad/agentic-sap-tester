// One-shot probe: time a single qwen3-vl-flash call to DashScope via two
// transport modes. Drop after debugging. Uses a tiny generated test image
// (no real screenshot needed — we're measuring round-trip time, not the
// model's actual reasoning quality).

import { ProxyAgent, Agent, setGlobalDispatcher } from 'undici';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV = Object.fromEntries(
  readFileSync(resolve('.env'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const API_KEY = ENV.MIDSCENE_MODEL_API_KEY;
const BASE = ENV.MIDSCENE_MODEL_BASE_URL;
const MODEL = ENV.MIDSCENE_MODEL_NAME || 'qwen3-vl-flash';
const PROXY = ENV.LLM_PROXY_URL || ENV.MIDSCENE_MODEL_HTTP_PROXY;

console.log('Endpoint :', BASE);
console.log('Model    :', MODEL);
console.log('Proxy    :', PROXY || '(direct, no proxy)');
console.log('');

// Tiny 1x1 transparent PNG (base64), small enough to avoid payload-related
// noise — we want to measure the latency of "model picks up + responds",
// not "we uploaded MBs of image data".
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function buildBody({ withImage }) {
  const content = withImage
    ? [
        { type: 'text', text: '请用一个字描述这张图片的颜色。' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${PNG_BASE64}` } },
      ]
    : '请用一个字回答：你好';
  return {
    model: MODEL,
    messages: [{ role: 'user', content }],
    temperature: 0.1,
    max_tokens: 32,
  };
}

async function call({ label, useProxy, withImage }) {
  if (useProxy && PROXY) setGlobalDispatcher(new ProxyAgent({ uri: PROXY, headersTimeout: 60_000, bodyTimeout: 60_000 }));
  else setGlobalDispatcher(new Agent({ headersTimeout: 60_000, bodyTimeout: 60_000 }));

  const url = `${BASE.replace(/\/$/, '')}/chat/completions`;
  const t0 = Date.now();
  let status, text;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(buildBody({ withImage })),
    });
    status = res.status;
    text = await res.text();
  } catch (e) {
    const elapsed = Date.now() - t0;
    console.log(`${label}  ${elapsed}ms  ERROR  ${e.message}`);
    return;
  }
  const elapsed = Date.now() - t0;
  let snippet = text.slice(0, 200);
  try {
    const json = JSON.parse(text);
    snippet = json?.choices?.[0]?.message?.content || JSON.stringify(json).slice(0, 200);
  } catch { /* keep raw */ }
  console.log(`${label}  ${elapsed}ms  HTTP ${status}  →  ${snippet.replace(/\n/g, ' ')}`);
}

// Run sequentially: text-direct, text-via-proxy, image-direct, image-via-proxy.
await call({ label: 'text direct      ', useProxy: false, withImage: false });
if (PROXY) await call({ label: 'text via proxy   ', useProxy: true,  withImage: false });
await call({ label: 'image direct     ', useProxy: false, withImage: true });
if (PROXY) await call({ label: 'image via proxy  ', useProxy: true,  withImage: true });
