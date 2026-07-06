#!/usr/bin/env node
// PreToolUse hook: enforce "MCP-first for code search" (CLAUDE.md §5).
//
// Receives a JSON envelope on stdin:
//   { "tool_name": "Grep" | "Glob", "tool_input": { ... } }
//
// Decides:
//   exit 0          → allow (tool call proceeds normally)
//   exit 2 + stderr → block (model sees the stderr message and must retry differently)
//
// Block rule (in plain words):
//   The project is indexed in codebase-memory. For CODE exploration the model
//   must call mcp__codebase-memory-mcp__* first. So Grep/Glob is blocked when
//   it would search code files. Non-code targets (.md, .yaml, .json, .env,
//   Dockerfile, etc.) pass through.
//
// Escape hatch: any input containing `#mcp-fallback` is allowed unconditionally
// — for the rare case where MCP genuinely doesn't cover the query (HTML
// attribute text, comment text the graph strips, an un-indexed file, etc.).

import { stdin } from 'node:process';

// Extensions that mean "code" — Grep/Glob on these must go through MCP.
const CODE_EXTS = new Set([
  'js','ts','jsx','tsx','mjs','cjs',
  'html','htm','vue','svelte',
  'py','go','java','rb','php',
  'cs','cpp','cxx','cc','c','h','hpp','hxx',
  'rs','kt','swift','scala','clj','cljs',
  'ex','exs','lua','sh','ps1','bash','zsh',
  'm','mm','dart','erl','hrl','elm','ml','mli',
]);

// Grep --type values that mean "code".
const CODE_TYPES = new Set([
  'js','ts','jsx','tsx','html','vue',
  'py','python','go','golang','java','javascript','typescript',
  'rb','ruby','rust','c','cpp','cxx','c++','csharp','cs',
  'kotlin','swift','scala','clojure','elixir','lua','sh','bash',
  'php','dart','erlang','elm','ocaml',
]);

// Extensions that mean "not code" — Grep/Glob targeting these is allowed.
const NONCODE_EXTS = new Set([
  'md','markdown','rst','txt','log',
  'yaml','yml','json','json5','jsonc',
  'toml','ini','cfg','conf','env',
  'lock','xml','csv','tsv','sql',
  'editorconfig','gitignore','gitattributes',
  'cache',  // *.cache.yaml files in this project
]);

// Filenames (no extension) that count as non-code config.
const NONCODE_NAMES = new Set([
  'Dockerfile','Makefile','LICENSE','README','CHANGELOG','NOTICE',
  '.gitignore','.gitattributes','.editorconfig','.env','.dockerignore',
]);

const FALLBACK_TOKEN = '#mcp-fallback';

function readStdin() {
  return new Promise((resolve) => {
    let buf = '';
    stdin.setEncoding('utf8');
    stdin.on('data', (c) => { buf += c; });
    stdin.on('end', () => resolve(buf));
    // If stdin is closed/empty quickly (some hook test invocations) resolve too.
    setTimeout(() => resolve(buf), 200);
  });
}

// Pull every extension referenced inside a glob like "*.{js,ts}" or "**/*.md"
// or "src/**/*.tsx". Returns lowercase strings, no leading dot. [] if none.
function extractExtensions(glob) {
  if (!glob || typeof glob !== 'string') return [];
  const exts = [];
  // {a,b,c} braces
  const braces = glob.match(/\{[^}]+\}/g) || [];
  for (const b of braces) {
    for (const part of b.slice(1, -1).split(',')) {
      const e = part.trim().replace(/^\*?\.?/, '').toLowerCase();
      if (e) exts.push(e);
    }
  }
  // Plain trailing extension when no braces present
  if (braces.length === 0) {
    const m = glob.match(/\.([a-zA-Z0-9]+)$/);
    if (m) exts.push(m[1].toLowerCase());
  }
  return exts;
}

// Classify a glob pattern. 'code' / 'noncode' / 'unknown'.
function classifyGlob(glob) {
  if (!glob) return 'unknown';
  // Bare filename mention (Dockerfile / Makefile)
  for (const n of NONCODE_NAMES) {
    if (glob.includes(n)) return 'noncode';
  }
  const exts = extractExtensions(glob);
  if (exts.length === 0) return 'unknown';
  if (exts.some((e) => CODE_EXTS.has(e))) return 'code';
  if (exts.every((e) => NONCODE_EXTS.has(e))) return 'noncode';
  return 'unknown';
}

const BLOCK_MESSAGE = `⚠ MCP-FIRST RULE (CLAUDE.md §5 — enforced):
This project is indexed in codebase-memory as \`C-Users-BOG1SGH-saptest1\`.
For code exploration use these BEFORE Grep/Glob:
  • mcp__codebase-memory-mcp__search_graph(name_pattern=...)
  • mcp__codebase-memory-mcp__get_code_snippet(qualified_name=...)
  • mcp__codebase-memory-mcp__trace_path(function_name=..., mode=calls|data_flow|cross_service)
  • mcp__codebase-memory-mcp__search_code(pattern=...)  ← graph-augmented grep, last resort

Load the schema first:
  ToolSearch(query="select:mcp__codebase-memory-mcp__search_graph,mcp__codebase-memory-mcp__get_code_snippet,mcp__codebase-memory-mcp__trace_path,mcp__codebase-memory-mcp__search_code")

If MCP genuinely does not cover this query (un-indexed file, HTML attribute text the graph strips, etc.), retry the SAME tool call with the literal token \`#mcp-fallback\` embedded somewhere in the pattern or glob — the hook will let you through.`;

function block(reason) {
  process.stderr.write(`${BLOCK_MESSAGE}\n\nHook reason: ${reason}\n`);
  process.exit(2);
}

function allow() {
  process.exit(0);
}

const raw = await readStdin();
let payload;
try {
  payload = JSON.parse(raw);
} catch {
  // Malformed envelope — fail open. The harness usually delivers valid JSON;
  // any test invocation without proper JSON should not break real tool calls.
  allow();
}

const tool = payload?.tool_name;
const input = payload?.tool_input || {};

// Escape hatch — explicit opt-out via any string field containing the token.
const joinedInputs = JSON.stringify(input);
if (joinedInputs.includes(FALLBACK_TOKEN)) {
  allow();
}

if (tool === 'Grep') {
  const { glob, type, pattern } = input;
  // 1. Explicit code --type wins.
  if (type && CODE_TYPES.has(String(type).toLowerCase())) {
    block(`Grep --type=${type} targets a code language`);
  }
  // 2. Explicit non-code --type is fine.
  if (type && !CODE_TYPES.has(String(type).toLowerCase())) {
    allow();
  }
  // 3. Glob narrows the scope — use its classification.
  if (glob) {
    const k = classifyGlob(glob);
    if (k === 'code') block(`Grep --glob=${glob} targets code files`);
    if (k === 'noncode') allow();
    // unknown extension — be conservative, block.
    block(`Grep --glob=${glob} has unknown extension(s); cannot prove non-code`);
  }
  // 4. Neither glob nor type set → unscoped grep across the whole repo. Block.
  block(`Grep called without --glob/--type filter; an unscoped repo-wide grep is almost always a code search`);
}

if (tool === 'Glob') {
  const { pattern } = input;
  const k = classifyGlob(pattern);
  if (k === 'code') block(`Glob pattern=${pattern} targets code files`);
  if (k === 'noncode') allow();
  block(`Glob pattern=${pattern} cannot be proven non-code; conservative block`);
}

// Hook only matches Grep|Glob via the settings matcher, but be safe.
allow();
