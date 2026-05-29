// 把指定 case 的 cache YAML 里 type: plan 条目的 prompt 替换成当前
// apiGuide 里 aiAct 步骤实际调用的字符串。
//
// 适用场景：用户编辑 NL / 让 Gen API 重新生成 apiGuide 之后，aiAct 措辞
// 变了，cache 里的 plan prompt 跟新 apiGuide 对不上 → 每次跑都重新调
// LLM Plan。手工对齐一次，之后保持 apiGuide 不变就能命中 cache。
//
// usage: node scripts/realign-cache-prompts.mjs <caseId> [--dry-run]
//
// 配对策略：按"方向签名"（最底/最顶/最左/最右）匹配。
//   1. 跳过 runner 注入的 recovery 条目（prompt 以 "Recover and ..." 开头）
//   2. 给 apiGuide 每个 aiAct 抽取方向签名 (extreme:bottom 等)
//   3. 给 cache 每个 plan 条目抽取方向签名
//   4. 同方向的 cache 条目 → 替换成对应 apiGuide prompt
//   5. cache 里有但 apiGuide 没有的方向 → 报告不动
//   6. apiGuide 里有但 cache 没有的方向 → 报告不动（要靠 run 录入）

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { buildJavascriptCacheId, resolveCachePath } from '../server/midscene/cache-id.js';

const caseId = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');
if (!caseId) {
  console.error('usage: node scripts/realign-cache-prompts.mjs <caseId> [--dry-run]');
  process.exit(1);
}

const casePath = `e2e/cases/${caseId}.json`;
if (!existsSync(casePath)) { console.error(`no such case JSON: ${casePath}`); process.exit(1); }
const caseObj = JSON.parse(readFileSync(casePath, 'utf8'));
caseObj.id = caseId;

const currentCacheId = buildJavascriptCacheId(caseObj);
const cachePath = resolveCachePath(currentCacheId);
if (!existsSync(cachePath)) {
  console.error(`no cache file at ${cachePath}`);
  console.error('(run Run JS w/ Cache once first so the file exists, then come back)');
  process.exit(1);
}

// 1) Extract aiAct prompts from current apiGuide, in step.order
const aiActPrompts = [];
for (const s of caseObj.apiGuide?.steps ?? []) {
  const m = (s.exampleCode || '').match(/agent\.aiAct\s*\(\s*(['"`])([\s\S]*?)\1/);
  if (m) aiActPrompts.push({ order: s.order, prompt: m[2], title: s.title || '' });
}

// 2) Find all `type: plan` blocks in cache, in order. Pull current prompt.
const cacheText = readFileSync(cachePath, 'utf8');
const headerMatch = cacheText.match(/^([\s\S]*?\bcaches:\s*\n)/);
if (!headerMatch) { console.error('cache has no "caches:" block'); process.exit(1); }
const header = headerMatch[1];
const tail = cacheText.slice(header.length);
const blockStart = /^\s{0,4}-\s+type:/gm;
const positions = [];
let m;
while ((m = blockStart.exec(tail)) !== null) positions.push(m.index);
const blocks = positions.map((p, i) => tail.slice(p, i + 1 < positions.length ? positions[i + 1] : tail.length));
const preamble = tail.slice(0, positions[0] || 0);

const planBlocks = [];
for (let i = 0; i < blocks.length; i++) {
  const b = blocks[i];
  if (!/^\s*-\s+type:\s*plan\b/m.test(b)) continue;
  const pm = b.match(/^(\s*)prompt:\s*(.+?)\s*$/m);
  if (!pm) continue;
  planBlocks.push({ idx: i, indent: pm[1], oldPrompt: pm[2].replace(/^['"]|['"]$/g, '') });
}

console.log(`Case: ${caseId}`);
console.log(`Cache file: ${cachePath}`);
console.log(`apiGuide aiAct steps: ${aiActPrompts.length}`);
console.log(`Cache "type: plan" entries: ${planBlocks.length}`);
console.log('');

if (aiActPrompts.length === 0) {
  console.log('No aiAct steps in apiGuide — nothing to align.');
  process.exit(0);
}

// Extract direction signature: 最X (顶/底/上/下/左/右)
function dirSig(text) {
  if (!text) return null;
  if (/^Recover and complete this UI action only:/i.test(text)) return null; // runner-injected recovery, leave alone
  const m = text.match(/最([顶底上下左右])/);
  return m ? m[1] : null;
}

// Build apiGuide direction → newPrompt map (last one wins if duplicates)
const dirToNew = new Map();
for (const ap of aiActPrompts) {
  const d = dirSig(ap.prompt);
  if (d) dirToNew.set(d, ap);
}

if (planBlocks.length === 0) {
  console.log('No plan entries in cache — nothing to align.');
  process.exit(0);
}

// 3) For each cache plan block, find the matching direction in apiGuide
//    and rewrite. Skip recovery entries (dirSig returns null for those).
let changed = 0, skippedRecovery = 0, skippedNoMatch = 0;
for (const pb of planBlocks) {
  const oldDir = dirSig(pb.oldPrompt);
  if (oldDir === null) {
    // Either a recovery prompt or no direction marker — leave alone.
    if (/^Recover and complete/i.test(pb.oldPrompt)) skippedRecovery++;
    else skippedNoMatch++;
    continue;
  }
  const ap = dirToNew.get(oldDir);
  if (!ap) {
    skippedNoMatch++;
    console.log(`(no apiGuide aiAct with direction "最${oldDir}" — leaving cache entry alone)`);
    continue;
  }
  if (pb.oldPrompt === ap.prompt) continue; // already aligned
  changed++;
  const b = blocks[pb.idx];
  let nb = b.replace(/^(\s*)prompt:\s*.+$/m, `$1prompt: ${ap.prompt}`);
  nb = nb.replace(/(\s*-\s*name:\s*)([^\n>][^\n]*)/, (_, lead) => `${lead}${ap.prompt}`);
  blocks[pb.idx] = nb;
  console.log(`direction 最${oldDir} (step ${ap.order}): realigned prompt`);
  console.log(`  was: ${pb.oldPrompt.slice(0, 120)}`);
  console.log(`  now: ${ap.prompt.slice(0, 120)}`);
}
console.log('');
console.log(`Summary: changed=${changed}, skippedRecovery=${skippedRecovery}, skippedNoMatch=${skippedNoMatch}`);

if (changed === 0) {
  console.log('All plan prompts already match current apiGuide — no changes needed.');
  process.exit(0);
}
console.log(`\n${changed} plan entr${changed === 1 ? 'y' : 'ies'} rewritten.`);

if (isDryRun) {
  console.log('(--dry-run: no file written)');
  process.exit(0);
}

const next = header + preamble + blocks.join('');
writeFileSync(cachePath, next, 'utf8');
console.log(`Wrote ${cachePath}`);
