import { readFileSync } from 'node:fs';

const raw = readFileSync('midscene_run/cache/saptest-js-saptest1-8a9a74e70c5a.cache.yaml', 'utf8');

const cachedLocatorPrompts = new Set();
const cachedXpaths = new Map();
const lines = raw.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
  if (!/^\s*-\s*type:\s*locate\s*$/.test(lines[i])) continue;
  let prompt = null;
  for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
    const m = /^\s*prompt:\s*(.*?)\s*$/.exec(lines[j]);
    if (m) { prompt = m[1]; break; }
  }
  if (!prompt) continue;
  cachedLocatorPrompts.add(prompt);
  const xpaths = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^\s*-\s*type:\s*/.test(lines[j])) break;
    const xm = /^\s*-\s*(\/[^\s].*?)\s*$/.exec(lines[j]);
    if (xm) xpaths.push(xm[1]);
  }
  if (xpaths.length) cachedXpaths.set(prompt, xpaths);
}

console.log(`prompts: ${cachedLocatorPrompts.size}, with xpaths: ${cachedXpaths.size}`);
console.log('\nFirst 5 prompt→xpath entries:');
let i = 0;
for (const [prompt, xpaths] of cachedXpaths) {
  if (i++ >= 5) break;
  console.log(`  ${JSON.stringify(prompt)}:`);
  xpaths.forEach(xp => console.log(`    ${xp.slice(0, 100)}${xp.length > 100 ? '…' : ''}`));
}

console.log('\nSpecifically "点击visualization":');
const xp = cachedXpaths.get('点击visualization');
if (xp) xp.forEach(p => console.log(`  ${p}`));
else console.log('  (not found in xpath map)');
