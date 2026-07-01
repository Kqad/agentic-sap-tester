#!/usr/bin/env node
// Export a "public-safe" copy of this project to a sibling directory for
// publishing as an open-source sample. What this does:
//   1. Mirror the source tree into <dest>, with a strict exclude list
//      (no .env, no internal-only files, no scratch, no failed-run
//      noise, no SAP pitch deck, no meeting notes, no node_modules).
//   2. Scrub the internal SAP instance hostname out of case JSONs +
//      any other tracked file that mentions it.
//   3. Strip the `source` block from each case JSON (it references
//      internal Desktop project paths that aren't useful externally).
//   4. Prune run-history to ONE latest passing run per case, and the
//      midscene_run/report dir to match (no orphan reports).
//   5. Drop in a fresh public README.md, MIT LICENSE, and .env.example.
//
// Run:
//   node scripts/export-public.mjs
//
// Then in <dest>:
//   git init -b main
//   git config user.name "<your-name>"
//   git config user.email "<your-public-email>"
//   git add -A
//   git commit -m "Initial commit"
//   gh repo create Kqad/agentic-sap-tester --public --source=. --push
//
// Idempotent — re-running wipes <dest> and rebuilds.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..');
const DEST = process.argv[2] || path.resolve(SRC, '..', 'agentic-sap-tester');

const PUBLIC_HOST = 'your-sap-instance.example.com';
const INTERNAL_HOST_RE = /https?:\/\/[a-z0-9.-]*?(?:mhl\.wdisp\.bosch\.com|q4t\.wdisp\.bosch\.com)/gi;

// ── Exclude rules ─────────────────────────────────────────────────────
// Directories whose contents we drop entirely.
const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  '.claude/projects',
  '.codebase-memory',
  'bosch-frontend-design 1',
  'SAP_pitch_6.3',
  'sap_testcase',         // raw .docx + .mp4 source materials
  'midscene_run/log',
  'midscene_run/output',
  'midscene_run/screenshots',
  'web/docs',             // internal design/refactor notes; PUBLIC_README covers what matters
]);

// File-level skips: exact basenames + glob-like regex tests.
const EXCLUDE_FILE_NAMES = new Set([
  '.env', '.env.local',
  '会议纪要.txt',
  'NL_TO_JS_STEP_RULES.md',     // internal handbook
  'CLAUDE.md',                  // local Claude Code config (will rewrite minimal version)
  'README.md',                  // will be replaced with PUBLIC_README content
  '.eslintrc.json',
  'skills-lock.json',
]);

const EXCLUDE_FILE_PATTERNS = [
  /^gen-saptests.*\.mjs$/,      // one-off generators
  /^regen.*\.mjs$/,
  /^peek\.mjs$/,
  /^snap-.*\.(png|mjs)$/,
  /^.*\.tmp$/,
  /^.*\.b64$/,
  /^.*\.docx$/,
  /^Test Case.*\.mp4$/,
  /^_test-.*\.(json|sh)$/,
  /^_yd-test\.sh$/,
];

// Within run-history/: ONLY keep one latest-passing per case (filled
// in dynamically after we scan). Everything else dropped.
// Within midscene_run/cache/: drop all *-fail.cache.yaml (scratchpad)
// and any cache hash that doesn't match a run we kept.
// Within midscene_run/report/: drop HTML reports that don't match a
// kept run.

function rel(p) {
  return path.relative(SRC, p).replace(/\\/g, '/');
}

function shouldSkipDir(absPath) {
  const r = rel(absPath);
  if (!r) return false;
  if (EXCLUDE_DIRS.has(r)) return true;
  for (const d of EXCLUDE_DIRS) {
    if (r === d || r.startsWith(d + '/')) return true;
  }
  return false;
}

function shouldSkipFile(absPath) {
  const base = path.basename(absPath);
  if (EXCLUDE_FILE_NAMES.has(base)) return true;
  for (const re of EXCLUDE_FILE_PATTERNS) {
    if (re.test(base)) return true;
  }
  return false;
}

// ── Mirror tree ───────────────────────────────────────────────────────
function walk(dir, onFile) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (shouldSkipDir(abs)) continue;
      walk(abs, onFile);
    } else if (ent.isFile()) {
      if (shouldSkipFile(abs)) continue;
      onFile(abs);
    }
  }
}

function fresh(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

// Wrap the procedural code in a main() so README_MD (declared at the
// bottom of the file) is available without TDZ tripping us up.
await main();

async function main() {

console.log('Source     :', SRC);
console.log('Destination:', DEST);
console.log('Cleaning destination …');
fresh(DEST);

// ── Pass 1: copy everything that isn't excluded ──────────────────────
console.log('Copying source tree …');
let copied = 0, scrubbed = 0;
walk(SRC, (abs) => {
  const relPath = rel(abs);
  const out = path.join(DEST, relPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  // Text scrub for code/config files; binary copy for everything else.
  const ext = path.extname(abs).toLowerCase();
  const isTextish = ['.js', '.mjs', '.cjs', '.ts', '.json', '.yaml', '.yml', '.html', '.css',
                     '.md', '.txt', '.gitignore', '.env'].includes(ext) || !ext;
  if (isTextish && fs.statSync(abs).size < 5 * 1024 * 1024) {
    let txt = fs.readFileSync(abs, 'utf8');
    const before = txt;
    txt = txt.replace(INTERNAL_HOST_RE, `https://${PUBLIC_HOST}`);
    if (txt !== before) scrubbed++;
    fs.writeFileSync(out, txt);
  } else {
    fs.copyFileSync(abs, out);
  }
  copied++;
});
console.log(`  copied ${copied} files (${scrubbed} had host-scrub applied)`);

// ── Pass 2: strip `source` block from case JSONs ─────────────────────
console.log('Scrubbing case JSON `source` blocks …');
const casesDir = path.join(DEST, 'e2e', 'cases');
if (fs.existsSync(casesDir)) {
  for (const f of fs.readdirSync(casesDir)) {
    if (!f.endsWith('.json')) continue;
    const p = path.join(casesDir, f);
    try {
      const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
      let changed = false;
      if (obj.source) { delete obj.source; changed = true; }
      if (changed) fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
    } catch { /* ignore */ }
  }
}

// ── Pass 3: prune run-history → one latest passing per case ──────────
console.log('Pruning run-history (keep latest passing per case) …');
const runsDir = path.join(DEST, 'run-history');
const keepRunIds = new Set();
const keepReportNames = new Set();
const keepCacheIds = new Set();
if (fs.existsSync(runsDir)) {
  const bestByCase = {};
  for (const f of fs.readdirSync(runsDir)) {
    if (!f.endsWith('.json')) continue;
    const p = path.join(runsDir, f);
    let r;
    try { r = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { continue; }
    if (r?.status !== 'passed' || !r.caseId) continue;
    const cur = bestByCase[r.caseId];
    if (!cur || (r.finishedAt && r.finishedAt > cur.finishedAt)) {
      bestByCase[r.caseId] = { file: f, finishedAt: r.finishedAt || '', report: r.report, cacheId: r.cacheId, baseCacheId: r.baseCacheId };
    }
  }
  let removed = 0;
  const keepFiles = new Set(Object.values(bestByCase).map((v) => v.file));
  for (const f of fs.readdirSync(runsDir)) {
    if (f.endsWith('.json') && !keepFiles.has(f)) {
      fs.unlinkSync(path.join(runsDir, f));
      removed++;
    } else if (keepFiles.has(f)) {
      keepRunIds.add(f.replace(/\.json$/, ''));
    }
  }
  for (const v of Object.values(bestByCase)) {
    if (v.report?.url) keepReportNames.add(v.report.url.replace('/reports/', ''));
    if (v.cacheId) keepCacheIds.add(v.cacheId);
    if (v.baseCacheId) keepCacheIds.add(v.baseCacheId);
  }
  // Also keep cache-snapshots only for kept runs.
  const snapDir = path.join(runsDir, 'cache-snapshots');
  if (fs.existsSync(snapDir)) {
    let snapRemoved = 0;
    for (const f of fs.readdirSync(snapDir)) {
      const runId = f.replace(/\.cache\.yaml$/, '');
      if (!keepRunIds.has(runId)) {
        fs.unlinkSync(path.join(snapDir, f));
        snapRemoved++;
      }
    }
    console.log(`  cache-snapshots: removed ${snapRemoved}`);
  }
  console.log(`  run-history: kept ${keepFiles.size}, removed ${removed}`);
}

// ── Pass 4: prune midscene_run/report → match kept runs ──────────────
console.log('Pruning midscene_run/report (only kept-run HTMLs) …');
const reportDir = path.join(DEST, 'midscene_run', 'report');
if (fs.existsSync(reportDir)) {
  let removed = 0;
  for (const f of fs.readdirSync(reportDir)) {
    if (!f.endsWith('.html')) continue;
    if (!keepReportNames.has(f)) {
      fs.unlinkSync(path.join(reportDir, f));
      removed++;
    }
  }
  console.log(`  reports: removed ${removed}`);
}

// ── Pass 5: prune midscene_run/cache ────────────────────────────────
//   · always drop *-fail.cache.yaml (scratchpad, debug-only)
//   · keep pass slot files for cases referenced by any kept run
//     (or just keep all *-pass.cache.yaml since we want the public
//     demo to be runnable)
console.log('Pruning midscene_run/cache (drop fail slots + orphans) …');
const cacheDir = path.join(DEST, 'midscene_run', 'cache');
if (fs.existsSync(cacheDir)) {
  let removed = 0;
  for (const f of fs.readdirSync(cacheDir)) {
    const lower = f.toLowerCase();
    if (lower.startsWith('_') || f.endsWith('.lock')) {
      fs.unlinkSync(path.join(cacheDir, f)); removed++; continue;
    }
    if (lower.endsWith('-fail.cache.yaml')) {
      fs.unlinkSync(path.join(cacheDir, f)); removed++; continue;
    }
  }
  console.log(`  cache: removed ${removed} fail/orphan entries`);
}

// ── Drop in the public-facing README, LICENSE, .env.example, .gitignore ──
console.log('Writing README.md, LICENSE, .env.example, .gitignore …');

fs.writeFileSync(path.join(DEST, '.env.example'), `# ── LLM (Midscene vision model) ──────────────────────────────────────
# Any OpenAI-compatible vision-capable endpoint. Examples below — pick one
# and uncomment. The runner uses the same model for plan + locate + verify.
MIDSCENE_OPENAI_API_KEY=your-llm-api-key-here
MIDSCENE_MODEL_NAME=qwen3-vl-plus
MIDSCENE_OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# ── LLM (NL → step heuristic + dynamic-date resolver) ───────────────
# Same model is fine; the auto-conversion of natural-language test
# descriptions into Midscene API steps uses a chat-completion endpoint.
# Defaults to local heuristics if these aren't set.
YAML_LLM_API_KEY=your-llm-api-key-here
YAML_LLM_MODEL=qwen-turbo
YAML_LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
API_GUIDE_USE_LLM=0           # set to 1 to use the LLM for step generation;
                              # 0 = local heuristics only (recommended)

# ── App ──────────────────────────────────────────────────────────────
PORT=3000
AUTH_JWT_SECRET=replace-with-32-random-bytes
SESSION_COOKIE_NAME=saptest_session

# ── Optional: SAP instance default for new cases ────────────────────
# Set this if you want the "New case" dialog to pre-fill sapUrl.
SAP_DEFAULT_URL=https://your-sap-instance.example.com/sap/bc/gui/sap/its/webgui#

# ── Optional: corporate HTTP proxy ──────────────────────────────────
# HTTP_PROXY=http://proxy.example.com:8080
# HTTPS_PROXY=http://proxy.example.com:8080
`);

fs.writeFileSync(path.join(DEST, 'LICENSE'), `MIT License

Copyright (c) ${new Date().getFullYear()} Kqad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);

fs.writeFileSync(path.join(DEST, '.gitignore'), `# Dependencies
node_modules/

# Secrets / env
.env
.env.local

# Runtime artifacts
midscene_run/log/
midscene_run/output/
midscene_run/screenshots/
midscene_run/report/
midscene_run/cache/*.lock
midscene_run/cache/*-fail.cache.yaml

# Build / OS
.DS_Store
*.log
dist/
build/

# Editor
.idea/
.vscode/
*.swp

# Server runtime data (users, secrets, audit log)
server/data/

# Tracked exceptions:
#   · One passing run per case under run-history/ + its HTML report under
#     midscene_run/report/ — force-add the latest passing pair with
#     'git add -f' per case.
#   · *-pass.cache.yaml under midscene_run/cache/ — these are the gold
#     cache snapshots used by 'Run with cache'.
!midscene_run/report/.gitkeep
`);

// README — the big one (hoisted function so it can sit at file bottom).
fs.writeFileSync(path.join(DEST, 'README.md'), readmeText());

console.log('Done.');
console.log('');
console.log('Next:');
console.log(`  cd ${DEST}`);
console.log('  git init -b main');
console.log('  git config user.name "<your-name>"');
console.log('  git config user.email "<your-public-email>"');
console.log('  git add -A');
console.log('  git commit -m "Initial commit · agentic-sap-tester"');
console.log('  gh repo create Kqad/agentic-sap-tester --public --source=. --push \\');
console.log('    --description "AI-driven SAP WebGUI test runner with two-slot cache, three-tier recovery, and parallel execution."');

}  // end main()

function readmeText() {
  return `# agentic-sap-tester

> **AI-driven SAP WebGUI test runner.** Write tests in natural language,
> let a vision-capable LLM click through your SAP transactions, verify
> results, and self-heal when the screen drifts — with a two-slot cache
> that learns from every passing run, a three-tier recovery cascade for
> mid-run hiccups, and parallel multi-case execution out of the box.

Built on [Midscene.js](https://midscenejs.com) + [Playwright](https://playwright.dev).
Pure JavaScript; no extra build pipeline; runs in-process.

---

## Why

SAP WebGUI test automation has always been painful: brittle CSS selectors,
constantly drifting xpaths, custom DSLs nobody wants to learn, and recordings
that break the day SAP rolls a UI patch.

This project takes a different bet:

- **Tests as natural language** — the case definition is a numbered list
  of plain Chinese/English steps (\`"在左上角矩形输入框输入 VF03"\` /
  \`"click the Execute button at bottom-right"\`). A heuristic + LLM
  fallback turns that into Midscene API calls.
- **Vision model locates targets** — no xpath maintenance. The model
  sees a screenshot of the current SAP screen and figures out what to
  click. Once a step succeeds, its xpath is cached.
- **Cache replay** — subsequent runs replay the cached xpaths and skip
  the LLM call entirely. A 27-step case drops from ~4 minutes (raw) to
  ~45 seconds (cached). When the UI moves, that one step cache-misses,
  the LLM re-locates, and the cache refreshes for next time.
- **Self-healing recovery** — when a step gets stuck (popup, focus
  drift, locator gone), a three-tier cascade tries the smallest fix
  first (close popup), then a partial rollback (re-do the last N
  steps), then a full home-reset + replay-from-step-1. Runs that
  should have failed often finish.

---

## Demo

\`\`\`
    [ NL test step ]
            ↓ heuristic + LLM (optional)
    [ Midscene API steps ]
            ↓ Playwright + vision model
    [ SAP WebGUI run ]
            ↓
    Pass → cache locked in        Fail → 3-tier recovery cascade
                                        ↓ still failing
                                  [ scrub failing tail, save partial cache
                                    for next attempt ]
\`\`\`

A full run renders:
- a **live broadcast** of the SAP screens in the workbench
- a structured **Midscene HTML report** with screenshots per step
- a **cinema replay** view to scrub back through any historical run

---

## Architecture

\`\`\`
agentic-sap-tester/
├── server/                       Express + WS backend (Node 22+)
│   ├── index.js                  app bootstrap
│   ├── api/
│   │   ├── cases.js              REST: /api/cases — CRUD case JSONs
│   │   ├── midscene-js.js        REST: /api/midscene-js — run + Gen API + cache-debug
│   │   ├── results.js            REST: /api/results — run history
│   │   └── translate.js          REST: /api/translate — zh→en for reports
│   ├── auth/                     simple JWT-cookie auth
│   ├── midscene/
│   │   ├── runner.js             ★ the orchestrator — runs an apiGuide end-to-end
│   │   ├── recovery.js           ★ three-tier recovery cascade
│   │   ├── cache-id.js           cacheId derivation + slot path helpers
│   │   ├── cache-builder.js      materialize a slot from a snapshot + config
│   │   ├── cache-scrub.js        prompt-targeted YAML stripping
│   │   ├── llm.js                NL → step heuristic + LLM fallback
│   │   ├── variables.js          aiQuery variable capture + local comparison
│   │   └── downloads.js          local "did the file land in ~/Downloads?" assert
│   └── lib/
│       ├── strip-branding.js     theme the inlined Midscene report
│       └── translation.js        per-text cached zh→en for reports
├── web/                          vanilla JS frontend, no build
│   ├── app.js                    ★ workbench (developer UI)
│   ├── run-center.html           ★ Test Run Center (end-user UI)
│   ├── index.html
│   └── styles.css
├── e2e/cases/                    case JSONs (NL + apiGuide + params)
├── midscene_run/cache/           Midscene cache YAMLs (pass / fail slots)
├── run-history/                  one passing run record per case + per-run cache snapshots
└── scripts/                      helpers (cache scrubbing, exports, etc.)
\`\`\`

---

## Two-slot cache

Every case has TWO physical cache files:

| Slot | Filename | Updated by | Read by |
|---|---|---|---|
| **Pass** | \`<base>-pass.cache.yaml\` | Only successful runs | "Run with cache" (gold path) |
| **Fail** | \`<base>-fail.cache.yaml\` | Failed-but-kept raw runs (with \`keepCacheOnFailure\`) | "Run raw" (debug / iteration) |

Plus per-run **snapshots** under \`run-history/cache-snapshots/<runId>.cache.yaml\`.

The **Cache Debug** modal (one per case) lets you:
- pin either slot's source to a specific past run's snapshot;
- exclude individual steps from cache (persistent per-step bypass);
- for the fail slot: tweak how many trailing steps to scrub on the
  assumption that the last few steps before a crash hold the bad
  xpaths.

When a slot is rebuilt from a non-default config, the runner switches
from \`write-only\` to \`read-write\` so the seeded entries actually
replay (otherwise Midscene's write-only mode skips \`loadCacheFromFile\`
and the seed is wasted).

---

## Three-tier AI recovery

When a step is stuck (cache miss + element not found, or any other
runtime exception), the runner's recovery cascade fires:

| Tier | Action | Typical cost | What it covers |
|---|---|---|---|
| **1 · Light** | "Is there a popup blocking? Close it. Then let the runner retry the cached step." | ~10 s | Authorization dialogs, session warnings, cookie banners |
| **2 · Middle** | Model auto-judges how many prior steps to re-do (typically 1-3). Runner replays them from cache, then retries the stuck step. | ~15 s | Small state drift, accidental undo |
| **3 · Heavy** | Model clicks the SAP home logo. Runner replays *every* prior step from cache from step 1. Retries the stuck step. | ~30 s | Session wandered to wrong screen, hard focus loss |

After each tier, the runner re-probes cache rather than asking the model
to redo the stuck step itself — keeps the AI's job narrow and
deterministic.

---

## Quick start

### Prereqs

- **Node 22+**
- **Playwright Chromium** — \`npx playwright install chromium\` after install
- An **OpenAI-compatible vision model**. Tested with
  - Alibaba DashScope's Qwen3-VL-Plus (recommended; reasonable cost, strong on SAP screens)
  - GPT-4o
  - Claude 3.5 Sonnet (with vision)
- A reachable **SAP WebGUI** target. The codebase ships with case
  definitions referencing a placeholder \`your-sap-instance.example.com\` —
  replace that with your own instance URL in \`e2e/cases/*.json\`.

### Install + configure

\`\`\`bash
git clone https://github.com/Kqad/agentic-sap-tester
cd agentic-sap-tester
npm install
npx playwright install chromium

cp .env.example .env
# Edit .env — fill in MIDSCENE_OPENAI_API_KEY + AUTH_JWT_SECRET at minimum.
\`\`\`

### Run

\`\`\`bash
npm run dev            # backend at http://localhost:3000
\`\`\`

Open the workbench. The default login is configured under
\`server/data/users.json\` (created on first boot). Use the Cases panel
to import or edit a case, then click **Run JS** for a fresh recording
or **Run JS w/ Cache** for a cached replay.

---

## Writing a case

A case lives at \`e2e/cases/<id>.json\`. The shape:

\`\`\`json
{
  "title": "SAP TEST 9",
  "description": "Check Invoice - FI posting...",
  "sapUrl": "https://your-sap-instance.example.com/sap/bc/gui/sap/its/webgui#",
  "transactionCode": "VF03",
  "naturalLanguage": "1.进入 Menu, 点击 setting, 点击 visualization 并启用 show Ok code field, 并保存。\\n2.在 左上角矩形输入框 输入 VF03，按 Enter 回车键。\\n3.在 Billing document 输入框 输入 BX00000028，按 Enter 回车键。\\n...",
  "apiGuide": {
    "steps": [
      { "order": 1, "title": "进入 Menu", "midsceneApi": "agent.aiTap()",
        "exampleCode": "await agent.aiTap(\\"进入 Menu\\");" },
      ...
    ]
  },
  "params": {
    "3": "BX00000028"
  }
}
\`\`\`

Workflow:
1. Write the NL step list (\`naturalLanguage\`).
2. Click **Gen API** in the workbench — the local heuristic splits the
   NL into structured \`apiGuide.steps\` with inferred Midscene API
   names (\`aiTap\`, \`aiInput\`, \`aiQuery\`, \`aiAssert\`,
   \`aiKeyboardPress\`, \`aiScroll\`).
3. Optionally edit \`params\` to override per-step input values without
   touching the cache (the cacheId hashes locator strings, not values).
4. **Run JS** to record cache → **Run JS w/ Cache** for the fast path.

---

## REST API

All endpoints under \`/api/\`. Authenticated via JWT cookie unless noted.

| Verb | Path | What |
|---|---|---|
| GET | \`/api/cases\` | List cases (lightweight summary) |
| GET | \`/api/cases/:id\` | Full case JSON |
| PUT | \`/api/cases/:id\` | Update case |
| POST | \`/api/midscene-js/cases/:id/api-guide\` | Regenerate \`apiGuide.steps\` from NL |
| POST | \`/api/midscene-js/cases/:id/run?cache=read\|write\` | Run the case; body: \`{ headed, noCacheSteps, keepCacheOnFailure, params }\` |
| GET | \`/api/midscene-js/cases/:id/cache-debug\` | Cache slot config + snapshot list |
| PUT | \`/api/midscene-js/cases/:id/cache-debug\` | Save cache slot config |
| GET | \`/api/midscene-js/runs/active\` | Currently-running runs (poll-friendly) |
| POST | \`/api/midscene-js/runs/:runId/abort\` | Abort an in-flight run |
| GET | \`/api/results/recent\` | Recent runs across all cases |
| GET | \`/api/results/runs/:runId\` | Full record of one run (events, logs) |
| POST | \`/api/translate\` | Translate Chinese text in Midscene reports |

---

## Design notes

### Locator stability

The vision model returns a center coordinate + an xpath. Midscene
caches the xpath. On replay, the cached xpath is resolved against the
live DOM; if it still resolves, no LLM call. If it doesn't, the runner
falls into recovery.

Pre-flight cache check (in \`recovery.js\`) polls the page for up to
10 s waiting for cached xpaths to become resolvable — handles the case
where SAP popups/modals take a beat to render after a previous action.

### Why not just rely on Midscene's own cache?

Midscene's cache lookup is gated by:
1. The locator prompt string must match exactly.
2. The xpath must still resolve.
3. The entry index must be within \`cacheOriginalLength\` (the file
   length at load time).

Item #3 is a sharp edge: any entry the main loop appended (cache miss
→ LLM call → append) is invisible to subsequent lookups in the same
process. The runner explicitly bumps \`cacheOriginalLength\` before
recovery replay so freshly-appended entries become matchable.

### Keyboard press fallback

\`aiKeyboardPress("Enter")\` is sent to whatever has focus. If focus
is wrong, the press is silently lost. The runner takes a downsampled
(96×54 raw RGB) before/after fingerprint, tolerantly diffs, and
falls back to \`aiTap(<original-NL>)\` if the screen didn't actually
transition (cursor blink / loading icon diffs sit at ~0.02-3% which is
below the 8% threshold).

### Scroll-extreme verify

For "drag-to-last-edge" scroll steps, the runner computes the target
coordinate by geometry (find the slider via aiLocate, compute the
viewport edge) rather than asking the LLM to plan the whole drag.
Verifies the drag worked via sha1 of before/after screenshots; retries
up to 3 times with cache rollback on each failed attempt.

---

## Limitations / TODO

- The locale-specific heuristics in \`llm.js\` and \`variables.js\` are
  tuned for Chinese + English SAP test descriptions. Other languages
  would need their own keyword tables.
- The auth layer is intentionally minimal (single-user friendly). For
  multi-tenant use, wire up your IdP.
- The cinema replay reads JPEG screenshots from disk on each navigation
  — fine for ~50-step cases, would want streaming for huge ones.
- No CI integration yet; the runner is built for interactive use.

---

## License

[MIT](./LICENSE)

---

## Acknowledgements

- [Midscene.js](https://midscenejs.com) — the vision-model-driven web
  automation library this project is built on.
- [Playwright](https://playwright.dev) — browser automation foundation.
- [DashScope](https://help.aliyun.com/zh/model-studio/) (Qwen3-VL) —
  the default vision model.
`;
}

