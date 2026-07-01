#!/usr/bin/env node
// Export a public-safe copy of the robotic phone tester project
// (originally lgb_Demo_Qiao_4.24_v2) for open-source publication.
//
// Source : C:\Users\BOG1SGH\Downloads\lqa\lgb_Demo_Qiao_4.24_v2
// Dest   : C:\Users\BOG1SGH\robotic-phone-tester
//
// What this does:
//   1. Copies the Python source, templates/, static/, and
//      requirements file.
//   2. Strips lab-specific runtime artifacts (debug_screenshots/,
//      timing_reports/, __pycache__/, the calibration JPG of one
//      specific robot, etc).
//   3. Scrubs the lab WiFi name + robot-arm IP out of text files
//      and replaces them with placeholders.
//   4. Writes a fresh public README (drawn from the original Chinese
//      one but with sensitive bits redacted + an English summary
//      added at top), MIT LICENSE, .env.example, .gitignore.
//
// Run:
//   node scripts/export-lgb-public.mjs
//
// Then in the dest dir:
//   git init -b main
//   git config user.name "Kqad"
//   git config user.email "<your-public-email>"
//   git add -A
//   git commit -m "Initial commit · robotic-phone-tester"
//   git remote add origin https://github.com/Kqad/robotic-phone-tester.git
//   git push -u origin main
//
// Idempotent — re-running wipes <dest> and rebuilds.

import fs from 'node:fs';
import path from 'node:path';

const SRC = 'C:/Users/BOG1SGH/Downloads/lqa/lgb_Demo_Qiao_4.24_v2';
const DEST = process.argv[2] || 'C:/Users/BOG1SGH/robotic-phone-tester';

// Lab-internal strings to scrub from any text file we copy.
const SCRUBS = [
  { re: /\blqalqalqa\b/gi,                    to: '<your-lab-wifi-ssid>' },
  { re: /\b192\.168\.50\.46\b/g,              to: '<your-robot-arm-ip>' },
  { re: /https?:\/\/192\.168\.50\.46[:\d]*/g, to: 'http://<your-robot-arm-ip>:8888' },
];

const EXCLUDE_DIRS = new Set([
  '.git', '__pycache__', '.pytest_cache', '.venv', 'venv',
  'debug_screenshots',         // run-time captures
  'timing_reports',            // run-time reports
  'node_modules',
]);

const EXCLUDE_FILE_NAMES = new Set([
  '.env', '.env.local',
  'README.md',                 // we'll write a fresh one
  '192.168.50.46.jpg',         // robot-arm specific photo with IP in filename
  'calibration.json',          // lab-specific calibration data
  '.DS_Store',
]);

const EXCLUDE_FILE_PATTERNS = [
  /^\d+\.\d+\.\d+\.\d+\.jpg$/, // any IP-named jpg
  /\.(log|tmp|cache|lock|pyc)$/i,
];

function rel(p) { return path.relative(SRC, p).replace(/\\/g, '/'); }

function shouldSkipDir(absPath) {
  const r = rel(absPath);
  if (!r) return false;
  for (const d of EXCLUDE_DIRS) if (r === d || r.startsWith(d + '/')) return true;
  const segs = r.split('/');
  for (const seg of segs) {
    if (seg === '__pycache__' || seg.endsWith('.egg-info') || seg === '.pytest_cache') return true;
  }
  return false;
}
function shouldSkipFile(absPath) {
  const base = path.basename(absPath);
  if (EXCLUDE_FILE_NAMES.has(base)) return true;
  for (const re of EXCLUDE_FILE_PATTERNS) if (re.test(base)) return true;
  return false;
}

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

console.log('Source     :', SRC);
console.log('Destination:', DEST);
if (!fs.existsSync(SRC)) {
  console.error('Source dir not found. Adjust SRC at top of this script.');
  process.exit(1);
}
console.log('Cleaning destination …');
fresh(DEST);

console.log('Copying + scrubbing …');
let copied = 0, scrubbed = 0;
walk(SRC, (abs) => {
  const r = rel(abs);
  const out = path.join(DEST, r);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ext = path.extname(abs).toLowerCase();
  const isText = ['.py','.txt','.md','.json','.toml','.yaml','.yml','.cfg','.ini','.html','.js','.css','.gitignore','.env'].includes(ext) || !ext;
  if (isText && fs.statSync(abs).size < 5 * 1024 * 1024) {
    let txt;
    try { txt = fs.readFileSync(abs, 'utf8'); }
    catch { fs.copyFileSync(abs, out); copied++; return; }
    const before = txt;
    for (const { re, to } of SCRUBS) txt = txt.replace(re, to);
    if (txt !== before) scrubbed++;
    fs.writeFileSync(out, txt);
  } else {
    fs.copyFileSync(abs, out);
  }
  copied++;
});
console.log(`  copied ${copied} files (${scrubbed} text files had lab info scrubbed)`);

// Rename requirements_ui.txt → requirements.txt for convention.
const oldReq = path.join(DEST, 'requirements_ui.txt');
const newReq = path.join(DEST, 'requirements.txt');
if (fs.existsSync(oldReq) && !fs.existsSync(newReq)) {
  fs.renameSync(oldReq, newReq);
  console.log('  renamed requirements_ui.txt → requirements.txt');
}

console.log('Writing README.md, LICENSE, .env.example, .gitignore …');

fs.writeFileSync(path.join(DEST, '.env.example'), `# ── LLM endpoint ────────────────────────────────────────────────────
# Vision-capable LLM. The agent sends a phone-screen screenshot + the
# task description and asks for the next mechanical action (tap/swipe/
# voice-input/etc.). Tested with GPT-4o, Claude 3.5 Sonnet, and Qwen3-VL.
LLM_API_KEY=your-llm-api-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o

# ── Robot arm ───────────────────────────────────────────────────────
# IP / port of your robotic arm controller on the local LAN.
ROBOT_ARM_IP=192.168.1.100
ROBOT_ARM_PORT=8888

# ── Web UI ──────────────────────────────────────────────────────────
WEB_HOST=0.0.0.0
WEB_PORT=8000

# ── Optional: paths ─────────────────────────────────────────────────
DEBUG_SCREENSHOT_DIR=./debug_screenshots
TIMING_REPORT_DIR=./timing_reports
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

fs.writeFileSync(path.join(DEST, '.gitignore'), `# Python
__pycache__/
*.py[cod]
*$py.class
*.egg-info/
.pytest_cache/
.venv/
venv/

# Secrets / env
.env
.env.local

# Runtime artifacts
debug_screenshots/
timing_reports/
calibration.json           # lab-specific calibration; supply your own
*.log

# OS / editor
.DS_Store
.idea/
.vscode/
*.swp
`);

fs.writeFileSync(path.join(DEST, 'README.md'), readmeText());

// ── Workflow diagram ────────────────────────────────────────────────
// If the user has saved the 10-step closed-loop workflow image at any
// of the well-known paths below, copy it into docs/workflow.png so the
// README's embedded reference resolves. Skip silently if not found.
const WORKFLOW_CANDIDATES = [
  path.join(SRC, 'workflow.png'),
  path.join(SRC, 'docs', 'workflow.png'),
  'C:/Users/BOG1SGH/Desktop/workflow.png',
  'C:/Users/BOG1SGH/Downloads/workflow.png',
];
const docsDir = path.join(DEST, 'docs');
fs.mkdirSync(docsDir, { recursive: true });
let workflowFound = null;
for (const c of WORKFLOW_CANDIDATES) {
  if (fs.existsSync(c)) { workflowFound = c; break; }
}
if (workflowFound) {
  const dest = path.join(docsDir, 'workflow.png');
  fs.copyFileSync(workflowFound, dest);
  console.log(`  copied workflow diagram: ${workflowFound} → docs/workflow.png`);
} else {
  console.log('  ⚠ workflow.png not found at any known path — README will reference');
  console.log('    a missing image. Save the 10-step diagram to ONE of:');
  for (const c of WORKFLOW_CANDIDATES) console.log(`      ${c}`);
  console.log('    then re-run this script.');
}

console.log('Done.');
console.log('');
console.log('Next:');
console.log(`  cd ${DEST.replace(/\//g, path.sep)}`);
console.log('  git init -b main');
console.log('  git config user.name "Kqad"');
console.log('  git config user.email "<your-public-email>"');
console.log('  git add -A');
console.log('  git commit -m "Initial commit · robotic-phone-tester"');
console.log('  # Create empty repo at https://github.com/new');
console.log('  #   owner: Kqad   name: robotic-phone-tester   public');
console.log('  git remote add origin https://github.com/Kqad/robotic-phone-tester.git');
console.log('  git push -u origin main');

function readmeText() {
  return `# robotic-phone-tester

> **AI-driven robotic-arm phone automation testing.** A vision LLM
> looks at a top-down camera view of a real phone, decides what to
> do (tap / double-tap / long-press / swipe / voice-input / home /
> reset), and a robotic arm executes the action. Every step is screen-
> shotted, every cycle is verified against the goal, and the system
> auto-recovers from black-screen / stuck / repeated-action states
> until the task passes or hits its step budget.

![10-step closed-loop workflow: see → understand → plan → act → verify → adapt](docs/workflow.png)

Two ways to drive it:
- **CLI mode** — \`python lgb.py\`, type a natural-language test task at the prompt.
- **Web UI mode** — \`python ui_app.py\`, drop one or many cases into a browser, watch screenshots + live progress + verdicts.

---

## Why

Pure-software phone automation (ADB, Appium, …) breaks on devices
that don't expose a debug bridge, on lock screens that need real
biometrics, and on rooting-restricted enterprise builds. A
**physical arm + vision model** sidesteps all of that — to the phone,
the test is indistinguishable from a human finger.

The system is glued together from three pieces:
1. an **overhead camera** that screen-grabs the phone face,
2. a **vision-capable LLM** that decides the next action from that
   screenshot + the natural-language test task,
3. a **robotic arm** that physically performs the action.

…wrapped in a **closed loop** (see diagram above): the result of every
action is captured, compared against the prior frame, and fed back to
the LLM as the basis for the next decision. The loop only exits on a
pass verdict or a max-step cap — no manual intervention.

---

## The 10-step closed loop

The diagram up top maps the full flow. Pipeline-style:

| # | Step | What | Code |
|---|---|---|---|
| 1 | **Robot Interface Initialization** | LAN-scan, connect, status-check the arm | \`lgb.py\` (RobotInterface) |
| 2 | **Camera-Based Screen Perception** | Capture overhead view, perspective-transform, auto-rotate, resize | \`get_transform_image()\` |
| 3 | **Black-Screen Recovery** | Detect dark frames, wake the phone (double-tap → swipe-up → recheck) | \`wake_up_phone()\` |
| 4 | **VLM-Based Phone Identification** | Multi-modal model reads top-bar + nav mode → \`(brand, model, OS, nav_mode)\` | \`PhoneDetector\` |
| 5 | **UI State Recognition** | Classify current frame: \`home_screen\` / \`app_drawer\` / \`app_running\` / \`lock_screen\` | state heuristics |
| 6 | **Device-Specific Operation Guide** | Auto-learn how to open app drawer / go home / go back / scroll on THIS phone | per-device profile |
| 7 | **Task Reasoning (LLM/VLM)** | The brain: \`Observe → Reason → Plan → Decide\`. Outputs structured \`tool_call\` JSON | LLM client |
| 8 | **Tool-Call Parsing + Correction** | Validate the model's action; smart-correct common mistakes (e.g. should-be-swipe got left_click_drag) | action parser |
| 9 | **Robotic Execution** | Convert pixel coordinate to arm coordinate via calibration; arm performs the action | arm controller |
| 10 | **Visual Feedback & Failure Recovery** | Re-screenshot, diff against prior frame, judge completion. Black-screen / repeated-action / stuck → auto-recover | recovery branch |

→ loop back to step 2 until the task is **completed** or **max_steps** reached.

## Supported actions

\`left_click\` (tap) · \`double_click\` · \`long_press\` · \`left_click_drag\`
(swipe / scroll) · \`type\` (input text) · \`key\` (back / home / enter) ·
\`wait\` (sleep N seconds) · Plus the meta-actions \`Return Home\` and
\`Reset Arm\`. Coordinates use a 0–1000 normalized system, mapped to
arm coordinates via \`calibration.json\`.

---

## Key technology innovations

- **Robotic arm — physical interaction.** No software bridge to the phone; works on locked, biometric-gated, MDM-restricted devices.
- **Visual perception — real-time sensing.** Overhead camera + perspective transform = a clean phone-face frame on every cycle.
- **VLM + LLM — intelligent reasoning.** Vision model reads the screen; reasoning layer plans the next action with full task context.
- **Device adaptation — multi-phone support.** Brand / OS / nav-mode auto-detected → operation guide auto-loaded; same code works on different phones.
- **Closed loop — autonomous & robust.** Every action's result feeds back into the next decision. Black-screen / repeated-action / stuck → auto-recover.

> **From natural language to physical actions, fully automated.**

---

## Requirements

### Hardware

- A Windows PC (Linux works too with minor path tweaks)
- A robotic arm with networked control (the default protocol is the
  manufacturer's HTTP API on \`:8888\`)
- A target phone
- An overhead camera (USB or the arm's built-in vision module)
- PC + arm on the same LAN

### Network

The PC needs to be on the same LAN as the robot arm.

Configure your arm's IP via \`.env\`:
\`\`\`
ROBOT_ARM_IP=192.168.1.100
ROBOT_ARM_PORT=8888
\`\`\`

Sanity-check arm connectivity in a browser:
\`\`\`
http://<ROBOT_ARM_IP>:<ROBOT_ARM_PORT>/api/status
\`\`\`

If you see a JSON status response, the PC can talk to the arm.

### Software

- Python 3.10+
- A vision-capable LLM endpoint (OpenAI-compatible). Tested with
  GPT-4o, Claude 3.5 Sonnet, Qwen3-VL-Plus.

---

## Install

\`\`\`bash
git clone https://github.com/Kqad/robotic-phone-tester
cd robotic-phone-tester

python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env — set LLM_API_KEY, ROBOT_ARM_IP at minimum.
\`\`\`

---

## Run

### CLI mode

\`\`\`bash
python lgb.py
\`\`\`
Then type your test task at the prompt, e.g.:
\`\`\`
请打开微信，进入"扫一扫"，截图后返回桌面
\`\`\`

### Web UI mode

\`\`\`bash
python ui_app.py
# open http://localhost:8000
\`\`\`
Drop one or many cases into the textarea, hit Run, watch the live
screenshots and per-case results.

### Calibration

If your arm + camera setup is new, run:
\`\`\`bash
python calibrate.py
\`\`\`
This walks you through the touch-point calibration (camera-pixel ↔
arm-coordinate mapping) and writes \`calibration.json\` locally.
**\`calibration.json\` is gitignored** — it's specific to your rig.

---

## Project layout

\`\`\`
robotic-phone-tester/
├── README.md
├── LICENSE
├── requirements.txt
├── .env.example
├── .gitignore
├── lgb.py                       main CLI entry
├── ui_app.py                    Web UI entry (Flask or similar — see file)
├── gui_final_no_type.py         alternative GUI front (Tk / Qt)
├── calibrate.py                 arm ↔ camera calibration walkthrough
├── timing_tracker.py            per-step latency recorder
├── docs/
│   └── workflow.png             the 10-step closed-loop diagram (also at top of this README)
├── test.py                      sanity tests
├── templates/                   web UI HTML templates
└── static/                      web UI static assets
\`\`\`

---

## Customising

- **Different arm vendor**: re-implement the small HTTP shim in
  \`lgb.py\` that talks to \`/api/status\` + \`/api/move\`. The decision
  layer (LLM + parser) is hardware-agnostic.
- **Different camera**: the overhead-camera capture lives in one
  function in \`lgb.py\`; swap it for an OpenCV / phone-camera /
  whatever-you-have stream.
- **Different LLM**: change \`LLM_BASE_URL\` + \`LLM_MODEL\` in
  \`.env\`. The agent uses the standard OpenAI chat-completions shape.

---

## Limitations

- Voice input requires a speaker physically pointed at the phone mic —
  no virtual TTS path into the phone.
- Calibration is per-rig and must be redone if you move the camera or
  reseat the phone.
- State recognition is heuristic (matches against known top-bar /
  navigation-bar pixel patterns). Unusual launchers might confuse it
  — extend the patterns in the state-detection block of \`lgb.py\`.
- Single-arm, single-phone in the current code. Multi-rig orchestration
  is on the roadmap.

---

## License

[MIT](./LICENSE)
`;
}
