import 'dotenv/config';

const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL;
const apiKey  = process.env.MIDSCENE_MODEL_API_KEY;
const model   = process.env.MIDSCENE_MODEL_NAME;

console.log('baseUrl:', baseUrl);
console.log('model  :', model);
console.log('key    :', apiKey ? apiKey.slice(0, 10) + '...' : 'MISSING');

const r = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [{ role: 'user', content: 'Reply with exactly: PONG' }],
    max_tokens: 16,
  }),
});
console.log('status:', r.status);
const text = await r.text();
console.log(text.slice(0, 1000));
