#!/usr/bin/env node
// Export a public-safe copy of the ESM Requirement & Assessment Agent
// project to a sibling directory for publishing as open source.
//
// Source : C:\Users\BOG1SGH\Desktop\esm agent
// Dest   : C:\Users\BOG1SGH\requirement-assessment-agent
//
// What this does:
//   1. Copies ONLY the source code subset (src/, pyproject.toml, tests/).
//      Everything else in the source dir (Bosch internal docs, samples,
//      videos, the pitch HTML, BA toolbox templates) is excluded.
//   2. Scrubs internal-only references (Bosch URLs, hardcoded HDI template
//      paths, internal endpoints) out of text files we keep.
//   3. Writes a fresh public README.md, MIT LICENSE, .env.example, .gitignore
//      based on the architecture described in the Phase-1 pitch deck.
//
// Run:
//   node scripts/export-esm-public.mjs
//
// Then in the dest dir:
//   git init -b main
//   git config user.name "Kqad"
//   git config user.email "<your-public-email>"
//   git add -A
//   git commit -m "Initial commit · requirement-assessment-agent"
//   # create empty repo at https://github.com/new (owner Kqad, name
//   # requirement-assessment-agent, public, no README), then:
//   git remote add origin https://github.com/Kqad/requirement-assessment-agent.git
//   git push -u origin main
//
// Idempotent — re-running wipes <dest> and rebuilds.

import fs from 'node:fs';
import path from 'node:path';

const SRC = 'C:/Users/BOG1SGH/Desktop/esm agent';
const DEST = process.argv[2] || 'C:/Users/BOG1SGH/requirement-assessment-agent';

const INTERNAL_URL_RE = /https?:\/\/[a-z0-9.-]*?(?:bosch\.com|bosch-presales\.com|sharepoint\.com\/sites\/[^\s)"'<>]+)/gi;
const PLACEHOLDER_URL = 'https://your-internal-link.example.com';

// Directories whose contents we DROP entirely (relative to SRC).
const EXCLUDE_DIRS = new Set([
  '.git',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv',
  'node_modules',
  'data',                           // runtime cache
  '_extract',                       // extracted samples
  'input',                          // BA sample inputs
  'input_p1',
  'input_p2',
  'output',                         // generated outputs (real project data)
  'toolbox_ba',                     // Bosch BA template library
  'ESM_Agent_Pitch',                // pitch package — separate publishable artifact
  'thumbs',                         // pitch thumbnails
  'src/esm_agent/__pycache__',
  'src/esm_agent/agents/__pycache__',
  'src/esm_agent/parsers/__pycache__',
  'src/esm_agent/writer/__pycache__',
  'src/esm_agent.egg-info',
]);

// Exact filenames to skip (any directory).
const EXCLUDE_FILE_NAMES = new Set([
  '.env', '.env.local',
  'readme.txt',                     // will write a new README.md
  'esm agent.code-workspace',
  '_kill_streamlit.ps1',
  '_restart_webui.ps1',
  '.DS_Store',
]);

// Filename patterns to skip.
const EXCLUDE_FILE_PATTERNS = [
  // Bosch internal docs / samples
  /\.(docx|pdf|pptx|xlsx|xls)$/i,
  // Demo media
  /\.(mp4|mov|webm|avi)$/i,
  /\.(jpg|jpeg|png|gif|webp)$/i,        // strip ALL images — pitch screenshots are internal
  // Pitch packages
  /^ESM_Agent_Pitch.*\.(html|zip)$/i,
  /^demo_esm_agent.*$/i,
  // Bosch internal pages
  /^(B2R|Glossary|Responsibility|Role|Team)\s.*\.(html|pdf)$/i,
  /^Idea -.*\.pptx$/i,
  /^REF_Blueprint.*\.docx$/i,
  /^REU1.*\.xlsx$/i,
  /^Self-Service_Forms.*\.xlsx$/i,
  /^HDI Requirement Spec.*\.xlsx$/i,
  /^02-Webforms.*\.xlsx$/i,
  // Misc
  /\.(log|tmp|cache|lock)$/i,
];

function rel(p) { return path.relative(SRC, p).replace(/\\/g, '/'); }

function shouldSkipDir(absPath) {
  const r = rel(absPath);
  if (!r) return false;
  for (const d of EXCLUDE_DIRS) {
    if (r === d || r.startsWith(d + '/')) return true;
  }
  // Generic __pycache__ / .egg-info at any depth
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

console.log('Copying source tree (src/, pyproject.toml, tests/, scripts/) …');
let copied = 0, scrubbed = 0;
walk(SRC, (abs) => {
  const r = rel(abs);
  const out = path.join(DEST, r);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ext = path.extname(abs).toLowerCase();
  const isText = ['.py','.txt','.md','.json','.toml','.yaml','.yml','.cfg','.ini','.gitignore','.env'].includes(ext) || !ext;
  if (isText && fs.statSync(abs).size < 5 * 1024 * 1024) {
    let txt;
    try { txt = fs.readFileSync(abs, 'utf8'); }
    catch { fs.copyFileSync(abs, out); copied++; return; }
    const before = txt;
    // Internal URLs → placeholder
    txt = txt.replace(INTERNAL_URL_RE, PLACEHOLDER_URL);
    // Hardcoded HDI template path → relative templates/ placeholder
    txt = txt.replace(/(["'`])[A-Z]:[\\\/].*?HDI[^"'`]*\.xlsx\1/gi, '"templates/hdi.xlsx"');
    if (txt !== before) scrubbed++;
    fs.writeFileSync(out, txt);
  } else {
    fs.copyFileSync(abs, out);
  }
  copied++;
});
console.log(`  copied ${copied} files (${scrubbed} text files had URLs/paths scrubbed)`);

// Drop in fresh chrome.
console.log('Writing README.md, LICENSE, .env.example, .gitignore …');

fs.writeFileSync(path.join(DEST, '.env.example'), `# ── LLM endpoint ────────────────────────────────────────────────────
# Any OpenAI-compatible chat-completion endpoint. The agents call this
# via the openai SDK; pass your own base_url + key.
OPENAI_API_KEY=your-llm-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1            # or your provider's endpoint
OPENAI_MODEL=gpt-4o-mini                              # any chat-capable model

# Optional: separate model for the "reviewer" half of the assessor
# (the heuristic + reviewer two-layer scoring). If unset, OPENAI_MODEL
# is reused.
REVIEWER_MODEL=gpt-4o

# ── Run settings ────────────────────────────────────────────────────
# Max parallel agent calls (the 7 agents run in parallel by default).
MAX_PARALLEL_AGENTS=7

# Output dir for generated HDI .xlsx + companion .pptx + score report.
OUTPUT_DIR=./output

# HDI template path (your organization's BA template).
# Project default is templates/hdi.xlsx — replace with your own.
HDI_TEMPLATE=./templates/hdi.xlsx
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

# Runtime / output
data/
_extract/
output/
*.log

# OS / editor
.DS_Store
.idea/
.vscode/
*.swp

# Project-specific: BA inputs and generated artifacts belong outside the repo
input/
input_*/
templates/*.xlsx          # the HDI template is org-internal; keep out of git

# Demo media
*.mp4
*.mov
`);

fs.writeFileSync(path.join(DEST, 'README.md'), readmeText());

console.log('Done.');
console.log('');
console.log('Next:');
console.log(`  cd ${DEST.replace(/\//g, path.sep)}`);
console.log('  git init -b main');
console.log('  git config user.name "Kqad"');
console.log('  git config user.email "<your-public-email>"');
console.log('  git add -A');
console.log('  git commit -m "Initial commit · requirement-assessment-agent"');
console.log('  # Create empty repo at https://github.com/new');
console.log('  #   owner: Kqad   name: requirement-assessment-agent   public');
console.log('  git remote add origin https://github.com/Kqad/requirement-assessment-agent.git');
console.log('  git push -u origin main');

function readmeText() {
  return `# requirement-assessment-agent

> **AI-driven Business Analyst pipeline.** Takes raw BA materials
> (project blueprints in \`.docx\`, form specs in \`.xlsx\`, overview
> tables) and produces a fully-populated HDI requirement spec
> (\`.xlsx\`, 19 sheets) plus a companion \`.pptx\` with visualised
> activity / state diagrams — and an automated scoring report on
> every generated artifact.

Built around **seven parallel LLM agents** + a two-layer assessor
(heuristic + LLM reviewer) + format-preserving writers for Excel and
PowerPoint. Streamlit single-page UI; CLI for batch runs.

---

## What problem it solves

Writing HDI-format requirement specs by hand is a multi-day BA task per
project. The agent compresses the "fill the template" part to minutes:

\`\`\`
Raw BA dossier              The HDI deliverable
─────────────────           ──────────────────────────
project_blueprint.docx  ─┐  19-sheet xlsx (9 auto-filled)
self_service_forms.xlsx ─┼─▶ companion .pptx
forms_overview.xlsx     ─┘  per-item scoring report
\`\`\`

The agent doesn't replace the BA — it produces a **trustable first
draft** with assessor scores per item, so the BA spends their time on
review + judgment instead of cell-by-cell transcription.

---

## Architecture

\`\`\`
                ┌──────────────────────────────────────────┐
                │  Stage 1 · Parse                         │
                │  docx_parser + xlsx_parser + unified     │
                │  → normalised Project record             │
                └────────────────────┬─────────────────────┘
                                     │
                ┌────────────────────▼─────────────────────┐
                │  Stage 2 · Reason in parallel (7 agents) │
                ├──────────────────────────────────────────┤
                │  user_story_agent       → US + SPIDR AC  │
                │  nfr_agent              → NFR list       │
                │  business_case_agent    → AS-IS/TO-BE    │
                │  data_dict_agent        → entity × field │
                │  role_matrix_agent      → object × role  │
                │  notification_agent     → state-tx mails │
                │  diagram_agent          → activity+state │
                └────────────────────┬─────────────────────┘
                                     │
                ┌────────────────────▼─────────────────────┐
                │  Stage 3 · Assess                        │
                │  assessor.py: heuristic check + LLM      │
                │  reviewer, per-item score 0-100          │
                └────────────────────┬─────────────────────┘
                                     │
                ┌────────────────────▼─────────────────────┐
                │  Stage 4 · Write                         │
                │  hdi_writer → fills HDI .xlsx in place,  │
                │     preserving formulas + styles         │
                │  pptx_writer → renders BC / Activity /   │
                │     State slides into a fresh .pptx      │
                └──────────────────────────────────────────┘
\`\`\`

### The 7 agents

| Module | Output |
|---|---|
| \`user_story_agent.py\` | User stories with SPIDR acceptance criteria, role + phase + touchpoint |
| \`nfr_agent.py\` | Non-functional requirements (performance / security / availability / …) |
| \`business_case_agent.py\` | AS-IS, TO-BE, scope-in, scope-out (4 sections) |
| \`data_dict_agent.py\` | Data dictionary: entity × field × type × source × destination |
| \`role_matrix_agent.py\` | Role × object permission matrix |
| \`notification_agent.py\` | Email templates per state transition (trigger / to / subject / body) |
| \`diagram_agent.py\` | Activity flow (3-phase swim-lane) + state machine |

Each agent receives a shared **Project context** (parsed inputs +
glossary) and an agent-specific prompt template. Outputs are typed via
\`pydantic\` schemas in \`schemas.py\`, so downstream writers can rely
on shape without runtime guesswork.

### Two-layer scoring

\`assessor.py\` scores each generated item with:
1. A cheap heuristic pass (mandatory-field presence, length thresholds,
   format validation) — fast deterministic checks.
2. A LLM reviewer pass that grades the item against a rubric (clarity,
   completeness, testability, alignment with the original BA input).

Final per-item score = weighted combo. Items below threshold appear
in the report with concrete suggestions for the BA to address.

### Format-preserving writers

- **\`hdi_writer\`** loads the org's HDI template, fills the agent-
  generated cells, and saves — **all original formulas, styles, merged
  cells, and untouched sheets stay byte-identical**. Achieved via
  \`openpyxl\` operating on copies; never recreates the workbook.
- **\`pptx_writer\`** uses \`python-pptx\` to render three visualisation
  slides (BC summary, activity swim-lane, state machine) into a fresh
  companion deck.

---

## Quick start

### Prereqs

- Python **3.11+**
- An OpenAI-compatible vision-or-chat LLM endpoint. Tested with
  GPT-4o and DashScope Qwen3-Max.
- Your organization's HDI template (\`.xlsx\`). The repo doesn't ship
  one — place yours at \`templates/hdi.xlsx\`.

### Install

\`\`\`bash
git clone https://github.com/Kqad/requirement-assessment-agent
cd requirement-assessment-agent
python -m venv .venv && source .venv/bin/activate    # or .venv\\Scripts\\activate
pip install -e .

cp .env.example .env
# Edit .env — fill in OPENAI_API_KEY at minimum.
\`\`\`

### Run

CLI:
\`\`\`bash
esm-agent run \\
  --inputs path/to/inputs/ \\
  --template templates/hdi.xlsx \\
  --out output/
\`\`\`

Streamlit UI:
\`\`\`bash
streamlit run src/esm_agent/webapp.py
\`\`\`
Drop your inputs into the upload zone, hit Run, see the per-agent
progress + final HDI / PPTX preview + scoring report. Download buttons
on each artifact.

---

## Project layout

\`\`\`
requirement-assessment-agent/
├── README.md
├── LICENSE                MIT
├── pyproject.toml         packaging + dependencies
├── .env.example
├── .gitignore
├── src/esm_agent/
│   ├── __init__.py
│   ├── __main__.py        \`python -m esm_agent …\`
│   ├── cli.py             Typer CLI
│   ├── webapp.py          Streamlit single-page UI
│   ├── schemas.py         pydantic models (Project, UserStory, NFR, …)
│   ├── agents/
│   │   ├── llm_client.py
│   │   ├── user_story_agent.py
│   │   ├── nfr_agent.py
│   │   ├── business_case_agent.py
│   │   ├── data_dict_agent.py
│   │   ├── role_matrix_agent.py
│   │   ├── notification_agent.py
│   │   ├── diagram_agent.py
│   │   └── assessor.py        ← heuristic + reviewer two-layer scoring
│   ├── parsers/
│   │   ├── docx_parser.py
│   │   ├── xlsx_parser.py
│   │   └── unified.py         ← merges parsed inputs into one Project record
│   └── writer/
│       ├── hdi_writer.py      ← fills the HDI .xlsx template in-place
│       └── pptx_writer.py     ← renders companion .pptx
└── tests/
\`\`\`

---

## Customising for your org

The shipping agent code targets a generic HDI 19-sheet template. To
adapt to your own template:

1. Drop your template at \`templates/hdi.xlsx\`.
2. Open \`src/esm_agent/writer/hdi_writer.py\` and adjust the
   sheet/cell mapping table at the top — it's a single dict literal
   like \`SHEET_MAP = {"User Story": ("US", "B5"), ...}\`.
3. If your template has different column headers, you may also need to
   tweak the field-mapping in each agent's output schema (\`schemas.py\`).

The 7 agents themselves are template-agnostic — they emit structured
data, the writer handles the layout.

---

## Limitations

- Agent prompts are tuned for English/Chinese mixed input (common in
  Chinese-organization BA work). Other locales may need prompt tweaks.
- The HDI template path / cell mapping is hard-coded for one shape; not
  yet auto-discovered. See "Customising for your org".
- Assessor reviewer prompt is a single rubric. Multi-rubric support
  (one rubric per artifact type) is on the roadmap.
- Streamlit UI is single-tenant — no auth, no concurrent users.

---

## Roadmap

- Auto-detect HDI template structure (no per-cell mapping needed)
- Multi-rubric assessor (different rubrics for US / NFR / BC / diagram)
- Streaming responses in the Streamlit UI (currently buffered per agent)
- Agent-level caching so re-runs only redo changed agents
- Export the assessor report as a standalone .xlsx alongside HDI

---

## License

[MIT](./LICENSE)

---

## Acknowledgements

Inspired by enterprise BA workflow automation needs. Built with:
- [OpenAI Python SDK](https://github.com/openai/openai-python) (works
  with any compatible endpoint)
- [openpyxl](https://openpyxl.readthedocs.io) — XLSX read/write
- [python-pptx](https://python-pptx.readthedocs.io) — PPTX rendering
- [python-docx](https://python-docx.readthedocs.io) — DOCX parsing
- [pydantic](https://docs.pydantic.dev) — typed agent I/O
- [Typer](https://typer.tiangolo.com) — CLI
- [Streamlit](https://streamlit.io) — UI
`;
}
