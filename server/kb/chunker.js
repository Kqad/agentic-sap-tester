// Markdown chunker for the debug KB.
//
// Strategy: cut on H1 (`# `) and H2 (`## `) headings — each chunk
// carries its heading hierarchy + the YAML frontmatter tags so both
// the embedder and the metadata filter can key off structured info.
//
// Chunk size target: 200-800 tokens. Real chunks land 300-600 tokens
// with the way the seed KB is written (short focused sections). Long
// H2 blocks that exceed 800 tokens are split on H3 as a fallback.

import fs from 'node:fs';
import path from 'node:path';

const MAX_CHUNK_CHARS = 2400;  // ≈ 800 Chinese tokens or 1200 English

// Parse `--- yaml ---` frontmatter at the top. Returns { meta, body }.
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { meta: {}, body: text };
  const yaml = m[1];
  const meta = {};
  // Minimal YAML parser — key: value, key: [a, b, c]. Enough for our
  // frontmatter shape; we don't need full YAML spec.
  for (const line of yaml.split(/\r?\n/)) {
    const kv = /^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    const [, key, raw] = kv;
    let val = raw.trim();
    if (/^\[.*\]$/.test(val)) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    meta[key] = val;
  }
  return { meta, body: text.slice(m[0].length) };
}

// Split a body on lines that start with `## `. First slice (before the
// first ##) is the H1 preamble — attached to any chunk as top-level
// context if present.
function splitOnH2(body) {
  const lines = body.split(/\r?\n/);
  let h1 = '';
  const preamble = [];
  const sections = []; // { heading, lines: [] }
  let cur = null;
  for (const line of lines) {
    if (/^#\s+/.test(line)) { h1 = line.replace(/^#\s+/, '').trim(); continue; }
    if (/^##\s+/.test(line)) {
      if (cur) sections.push(cur);
      cur = { heading: line.replace(/^##\s+/, '').trim(), lines: [] };
      continue;
    }
    if (cur) cur.lines.push(line);
    else preamble.push(line);
  }
  if (cur) sections.push(cur);
  return { h1, preamble: preamble.join('\n').trim(), sections };
}

// If a section is too long, split further on H3 (### ). If still too
// long, cut on paragraph boundary.
function furtherSplit(section) {
  const text = section.lines.join('\n').trim();
  if (text.length <= MAX_CHUNK_CHARS) return [{ heading: section.heading, text }];
  const parts = [];
  const bySubhead = text.split(/(?=^###\s+)/m).filter(Boolean);
  if (bySubhead.length > 1) {
    for (const sub of bySubhead) {
      const subHead = (/^###\s+(.*)$/m.exec(sub) || [, ''])[1];
      const subBody = sub.replace(/^###\s+.*\r?\n?/, '').trim();
      parts.push({ heading: `${section.heading} · ${subHead}`.trim(), text: subBody });
    }
  } else {
    // Fallback: paragraph split
    let buf = '';
    for (const para of text.split(/\n{2,}/)) {
      if (buf.length + para.length + 2 > MAX_CHUNK_CHARS && buf) {
        parts.push({ heading: section.heading, text: buf.trim() });
        buf = '';
      }
      buf += (buf ? '\n\n' : '') + para;
    }
    if (buf) parts.push({ heading: section.heading, text: buf.trim() });
  }
  return parts;
}

// Public: turn a single md file into ordered chunks.
export function chunkMarkdown(text, relPath = '') {
  const { meta, body } = parseFrontmatter(text);
  const { h1, preamble, sections } = splitOnH2(body);
  const out = [];
  // If there's a preamble (introduction before first H2), emit it too.
  if (preamble && preamble.length > 20) {
    out.push({
      title: h1 || relPath,
      section: '(intro)',
      text: preamble,
      meta,
      relPath,
    });
  }
  for (const sec of sections) {
    for (const part of furtherSplit(sec)) {
      out.push({
        title: h1 || relPath,
        section: part.heading,
        text: part.text,
        meta,
        relPath,
      });
    }
  }
  return out;
}

// Walk a directory and chunk every .md file. Returns a flat list.
export function chunkKbDir(rootDir) {
  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.md')) files.push(p);
    }
  })(rootDir);
  const chunks = [];
  for (const abs of files) {
    const rel = path.relative(rootDir, abs).replace(/\\/g, '/');
    const text = fs.readFileSync(abs, 'utf8');
    for (const c of chunkMarkdown(text, rel)) chunks.push(c);
  }
  return chunks;
}
