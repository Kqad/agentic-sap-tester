import { readFileSync } from 'node:fs';

const raw = readFileSync('midscene_run/cache/saptest-js-saptest1-8a9a74e70c5a.cache.yaml', 'utf8');
const cached = new Set();
const lines = raw.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (/^\s*-\s*type:\s*locate\s*$/.test(lines[i])) {
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const m = /^\s*prompt:\s*(.*?)\s*$/.exec(lines[j]);
      if (m) { cached.add(m[1]); break; }
    }
  }
}
console.log('cached prompts:', cached.size);
[...cached].slice(0, 5).forEach(p => console.log('  ', JSON.stringify(p)));

function extract(code) {
  if (!code) return [];
  const out = [];
  const re1 = /agent\.ai(?:Tap|Input|Hover|KeyboardPress)\s*\(\s*(['"`])([\s\S]*?)\1/g;
  let m;
  while ((m = re1.exec(code)) !== null) out.push(m[2]);
  const re2 = /agent\.aiScroll\s*\(\s*(?:\{[\s\S]*?\}|(['"`])[\s\S]*?\1)\s*,\s*(['"`])([\s\S]*?)\2/g;
  while ((m = re2.exec(code)) !== null) out.push(m[3]);
  return out;
}
const samples = [
  'await agent.aiTap("进入 Menu");',
  'await agent.aiInput("company code", { value: "8540" });',
  'await agent.aiQuery("book val.l column");',
  'await agent.aiAssert("page loaded");',
  'await agent.aiScroll({ scrollType: "untilBottom" }, "查询结果表格");',
  'await agent.aiScroll({ scrollType: "untilBottom" }, "在查询到的Asset History Sheet页面中");',
];
for (const code of samples) {
  const ps = extract(code);
  console.log(JSON.stringify(code), '→', ps.length ? ps : 'no locator');
}

console.log('\n--- miss prediction (extracted from each sample) ---');
for (const code of samples) {
  const ps = extract(code);
  const verdict = ps.length === 0 ? 'NO PRE-FLIGHT (no cached locator in this step)' :
    ps.every(p => cached.has(p)) ? 'all HIT → run normal path' :
    'at least one MISS → skip cache, go to replan';
  console.log(`  ${code} → [${ps.join(', ')}] → ${verdict}`);
}
