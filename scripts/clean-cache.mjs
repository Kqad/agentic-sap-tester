// 清洗一个 case 的当前 cache 文件：
//   1. 同 prompt 的 type: plan / type: locate 条目去重（保留最后一条）
//   2. 删除明显坏的 xpath —— iframe 自指（path|>>|same-path/iframe[1] 这种）
//      和空 xpaths 数组
//
// usage: node scripts/clean-cache.mjs <caseId> [--dry-run]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { buildJavascriptCacheId, resolveCachePath } from '../server/midscene/cache-id.js';

const caseId = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');
if (!caseId) { console.error('usage: node scripts/clean-cache.mjs <caseId> [--dry-run]'); process.exit(1); }

const casePath = `e2e/cases/${caseId}.json`;
if (!existsSync(casePath)) { console.error(`no such case JSON: ${casePath}`); process.exit(1); }
const caseObj = JSON.parse(readFileSync(casePath, 'utf8'));
caseObj.id = caseId;

const cachePath = resolveCachePath(buildJavascriptCacheId(caseObj));
if (!existsSync(cachePath)) { console.error(`no cache file at ${cachePath}`); process.exit(1); }

const text = readFileSync(cachePath, 'utf8');
const headerMatch = text.match(/^([\s\S]*?\bcaches:\s*\n)/);
if (!headerMatch) { console.error('cache has no "caches:" block'); process.exit(1); }
const header = headerMatch[1];
const tail = text.slice(header.length);

const re = /^\s{0,4}-\s+type:/gm;
const positions = [];
let m;
while ((m = re.exec(tail)) !== null) positions.push(m.index);
if (!positions.length) { console.error('no entries'); process.exit(0); }
const preamble = tail.slice(0, positions[0]);
const blocks = positions.map((p, i) => tail.slice(p, i + 1 < positions.length ? positions[i + 1] : tail.length));

// Detect garbage xpath patterns by looking ONLY under `xpaths:`:
//   - iframe self-reference: ".../iframe[1]|>>|.../iframe[1]"
//   - empty xpaths array
//   - xpath that doesn't start with `/` (not a real DOM path)
function isGarbageXpathBlock(block) {
  // Find `xpaths:` line and grab all the following bullet lines until the
  // next non-bullet block (i.e. another `cache:`/`type:` or end).
  const xpathsHeader = block.match(/^\s*xpaths:\s*$/m);
  if (!xpathsHeader) return false;
  const after = block.slice(xpathsHeader.index + xpathsHeader[0].length);
  // Match consecutive bullet items at indentation > xpaths header's
  const bulletRe = /^\s{6,}-\s+(.+)$/gm;
  const xpaths = [];
  let m;
  while ((m = bulletRe.exec(after)) !== null) xpaths.push(m[1].trim());
  if (xpaths.length === 0) return true; // empty xpaths: list
  for (const xp of xpaths) {
    if (xp.length === 0) return true;
    if (!xp.startsWith('/')) return true; // not a DOM path
    const sep = xp.match(/^(.+?)\|>>\|(.+)$/);
    if (sep && sep[1].trim() === sep[2].trim()) return true; // self-ref
  }
  return false;
}

function getType(block) {
  const m = block.match(/^\s*-\s*type:\s*(\w+)/);
  return m ? m[1] : null;
}
function getPrompt(block) {
  const m = block.match(/^\s*prompt:\s*(.+?)\s*$/m);
  return m ? m[1].replace(/^['"]|['"]$/g, '') : null;
}

// Collect prompts referenced by plan workflows (from:/to:/locate:) so we
// can keep plan/locate refs consistent when dropping entries.
function getPlanWorkflowRefs(block) {
  if (getType(block) !== 'plan') return [];
  const refs = [];
  const reFromTo = /^\s+(?:from|to|locate):\s*(.+?)\s*$/gm;
  let mm;
  while ((mm = reFromTo.exec(block)) !== null) refs.push(mm[1].trim());
  return refs;
}

// First pass: drop garbage xpath blocks (only for type:locate) and record
// the prompts that were dropped, so we can drop any plan that referenced them.
let droppedGarbage = 0;
const droppedLocatePrompts = new Set();
const afterGarbage = [];
for (const b of blocks) {
  if (getType(b) === 'locate' && isGarbageXpathBlock(b)) {
    droppedGarbage++;
    const p = getPrompt(b);
    if (p) droppedLocatePrompts.add(p);
    continue;
  }
  afterGarbage.push(b);
}

// 1b: drop plan entries whose workflow references a prompt that has NO
// corresponding `type: locate` entry in the cache. This includes both:
//   - locate entries we just dropped as garbage above
//   - locate entries that were deleted by an earlier cleanup run (e.g. older
//     versions of this script that didn't drop orphan plans)
// Without this, the plan's `to:`/`from:` points to a non-existent locate
// and Midscene falls back to LLM for that sub-locate at runtime. Let
// orphaned plans get re-recorded fresh on next run — the runner rollback
// ensures only the successful attempt's writes survive.
const liveLocatePrompts = new Set();
for (const b of afterGarbage) {
  if (getType(b) !== 'locate') continue;
  const p = getPrompt(b);
  if (p) liveLocatePrompts.add(p);
}
let droppedPlansForOrphanRef = 0;
const afterOrphanPlanDrop = [];
for (const b of afterGarbage) {
  if (getType(b) !== 'plan') {
    afterOrphanPlanDrop.push(b);
    continue;
  }
  const refs = getPlanWorkflowRefs(b);
  const hasOrphanRef = refs.some((r) => !liveLocatePrompts.has(r));
  if (hasOrphanRef) {
    droppedPlansForOrphanRef++;
    continue;
  }
  afterOrphanPlanDrop.push(b);
}

// Second pass: dedup by (type, prompt) — keep LAST occurrence
const seen = new Map();
const order = []; // preserve last-seen order for output
for (let i = 0; i < afterOrphanPlanDrop.length; i++) {
  const b = afterOrphanPlanDrop[i];
  const t = getType(b);
  const p = getPrompt(b);
  if (!t || p === null) {
    seen.set(`__raw_${i}`, b); // unmatchable; keep
    order.push(`__raw_${i}`);
    continue;
  }
  const key = `${t}::${p}`;
  if (!seen.has(key)) order.push(key);
  seen.set(key, b); // overwrite — last wins
}

let dedupedDropped = afterOrphanPlanDrop.length - order.length;
const keptBlocks = order.map((k) => seen.get(k));

console.log(`Case ${caseId}  cache ${cachePath}`);
console.log(`Entries: ${blocks.length} → garbage-dropped: ${droppedGarbage} → plan-dropped(orphan-ref): ${droppedPlansForOrphanRef} → dedup-dropped: ${dedupedDropped} → kept: ${keptBlocks.length}`);

if (droppedGarbage === 0 && droppedPlansForOrphanRef === 0 && dedupedDropped === 0) {
  console.log('No changes needed.');
  process.exit(0);
}

const next = header + preamble + keptBlocks.join('');
if (isDryRun) {
  console.log('(--dry-run: no file written)');
  process.exit(0);
}
writeFileSync(cachePath, next, 'utf8');
console.log(`Wrote ${cachePath} (${next.length} bytes)`);
