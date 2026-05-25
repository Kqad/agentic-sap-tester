// Post-process Midscene-augmented Playwright HTML reports to:
//   (a) remove the visible Midscene branding (title, favicon, logo image, a
//       few user-facing string literals embedded in the bundled JS), and
//   (b) inject a SAPTest theme block so reports look like part of the
//       platform — matching font (Geist), backgrounds, scrollbars, and
//       honoring `?theme=light|dark` passed by the embedding SPA.
//
// Internal webpack chunk names like `webpackChunk_midscene_report` and
// console.warn prefixes are LEFT ALONE — touching those would break the
// React app inside the report.
//
// Idempotency:
//   * The branding sweep is gated by a single HTML comment marker; once
//     stripped, those literal replacements are skipped on re-runs.
//   * The theme block is versioned via `data-saptest-themed="<n>"`. Bumping
//     THEME_VERSION causes any previously-themed file to be re-injected
//     with the new block on the next sweep.

import fs from 'node:fs/promises';
import { watch as fsWatch, mkdirSync } from 'node:fs';
import path from 'node:path';

const BRANDING_MARKER = '<!-- saptest:branding-stripped -->';
const BLANK_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Bump this whenever the injected style/script needs to change. Existing
// reports on disk will be re-themed on the next sweep.
const THEME_VERSION = '1';
const THEME_TAG_RE = /\n?<(style|script) data-saptest-themed="\d+">[\s\S]*?<\/\1>/g;

// JS string literals visible in the rendered UI (panel headings, error
// messages, alt text, log prefixes). The internal chunk identifier
// `webpackChunk_midscene_report` is intentionally NOT in this list.
const LITERAL_REPLACEMENTS = [
  ['"Midscene Report"',         '"Test Report"'],
  ["'Midscene Report'",         "'Test Report'"],
  ['"Midscene.js - Error"',     '"Error"'],
  ["'Midscene.js - Error'",     "'Error'"],
  ['"Midscene Codex Provider"', '"Codex Provider"'],
  ["'Midscene Codex Provider'", "'Codex Provider'"],
  ['"Midscene_logo"',           '"Logo"'],
  ["'Midscene_logo'",           "'Logo'"],
  ['"[Midscene]"',              '"[Test]"'],
  ["'[Midscene]'",              "'[Test]'"],
  ['Report - Midscene.js',      'Test Report'],
];

function buildThemeBlock(version) {
  // Style: inherits SAPTest design tokens (HSL channels mirror web/styles.css).
  // We deliberately stay scoped to body/html/scrollbars + font — touching the
  // React app's internal layout would require fighting a minified bundle.
  const css = `
    :root[data-saptest-theme] {
      --saptest-bg: 0 0% 100%;
      --saptest-fg: 240 10% 3.9%;
      --saptest-border: 240 5.9% 90%;
      --saptest-muted: 240 4.8% 95.9%;
      --saptest-muted-fg: 240 3.8% 46.1%;
    }
    :root[data-saptest-theme="dark"] {
      --saptest-bg: 240 10% 3.9%;
      --saptest-fg: 0 0% 98%;
      --saptest-border: 240 3.7% 15.9%;
      --saptest-muted: 240 3.7% 15.9%;
      --saptest-muted-fg: 240 5% 64.9%;
    }
    html[data-saptest-theme],
    html[data-saptest-theme] body {
      background: hsl(var(--saptest-bg)) !important;
      color: hsl(var(--saptest-fg));
      font-family: "Geist", "Geist Sans", ui-sans-serif, system-ui,
        -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
        "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial,
        sans-serif !important;
      font-feature-settings: "rlig" 1, "calt" 1;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    html[data-saptest-theme] code,
    html[data-saptest-theme] pre,
    html[data-saptest-theme] .mono,
    html[data-saptest-theme] [class*="mono"],
    html[data-saptest-theme] [class*="Mono"] {
      font-family: "Geist Mono", ui-monospace, "SF Mono", "JetBrains Mono",
        "Cascadia Mono", "Fira Code", Consolas, monospace !important;
      font-feature-settings: "tnum", "zero";
    }
    html[data-saptest-theme] ::-webkit-scrollbar { width: 10px; height: 10px; }
    html[data-saptest-theme] ::-webkit-scrollbar-track { background: transparent; }
    html[data-saptest-theme] ::-webkit-scrollbar-thumb {
      background: hsl(var(--saptest-border));
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    html[data-saptest-theme] ::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--saptest-muted-fg) / 0.5);
      background-clip: padding-box;
      border: 2px solid transparent;
    }
    html[data-saptest-theme] ::selection {
      background: hsl(var(--saptest-fg) / 0.15);
      color: hsl(var(--saptest-fg));
    }
  `.replace(/\s+/g, ' ').trim();

  // Script: read `?theme=` from the URL (set by the SAPTest SPA when it
  // embeds the report) and fall back to prefers-color-scheme. Sets a
  // data-saptest-theme attribute on <html> so the CSS above can react.
  const js = `
    (function () {
      try {
        var p = new URLSearchParams(location.search);
        var t = p.get('theme');
        if (t !== 'light' && t !== 'dark') {
          t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-saptest-theme', t);
      } catch (e) {
        document.documentElement.setAttribute('data-saptest-theme', 'light');
      }
    })();
  `.replace(/\s+/g, ' ').trim();

  // Geist font from Google Fonts. The SPA already preconnects + loads this,
  // so reports opened from within the platform will hit cache.
  const fontLink = `<link rel="stylesheet" data-saptest-themed="${version}" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">`;

  return (
    `\n${fontLink}` +
    `\n<style data-saptest-themed="${version}">${css}</style>` +
    `\n<script data-saptest-themed="${version}">${js}</script>`
  );
}

export function stripMidsceneBranding(html) {
  if (typeof html !== 'string') return null;

  const hasBrandingMarker = html.includes(BRANDING_MARKER);
  // Sniff theme version: find any data-saptest-themed="N" attribute. We
  // accept whatever version is present and only act if it's stale.
  const themeMatch = html.match(/data-saptest-themed="(\d+)"/);
  const themeUpToDate = themeMatch && themeMatch[1] === THEME_VERSION;

  if (hasBrandingMarker && themeUpToDate) return null;

  let out = html;

  if (!hasBrandingMarker) {
    // 1) Browser tab title.
    out = out.replace(/<title>[^<]*<\/title>/i, '<title>Test Report</title>');

    // 2) Favicon (the inline <link> spans multiple lines).
    out = out.replace(
      /<link\s+rel="icon"[\s\S]*?\/>/i,
      '<link rel="icon" href="data:,">',
    );

    // 3) Logo PNGs hosted on bytednsdoc — both dark and light variants.
    out = out.replace(
      /https:\/\/lf3-static\.bytednsdoc\.com\/obj\/eden-cn\/\w+\/Midscene\/midscene_with_text(?:_dark|_light)?\.png/g,
      BLANK_GIF,
    );

    // 4) User-facing string literals inside the bundled JS.
    for (const [from, to] of LITERAL_REPLACEMENTS) {
      if (out.includes(from)) out = out.split(from).join(to);
    }

    // 5) Mark as processed so the branding pass is idempotent.
    if (out.includes('</head>')) {
      out = out.replace('</head>', `${BRANDING_MARKER}</head>`);
    } else {
      out = `${BRANDING_MARKER}\n${out}`;
    }
  }

  if (!themeUpToDate) {
    // Wipe any previously-injected theme tags (any version) and re-emit.
    out = out.replace(THEME_TAG_RE, '');
    out = out.replace(/\n?<link rel="stylesheet" data-saptest-themed="\d+"[^>]*>/g, '');
    const themeBlock = buildThemeBlock(THEME_VERSION);
    if (out.includes('</head>')) {
      out = out.replace('</head>', `${themeBlock}\n</head>`);
    } else {
      out = `${themeBlock}\n${out}`;
    }
  }

  return out;
}

async function stripOneFile(file) {
  try {
    const html = await fs.readFile(file, 'utf8');
    const out = stripMidsceneBranding(html);
    if (out == null) return false;
    await fs.writeFile(file, out, 'utf8');
    return true;
  } catch {
    return false;
  }
}

// Watch the report directory and strip any new/modified .html file. Catches
// reports produced by CLI-driven runs (`npm test`) that bypass the
// /api/run/start spawn hook. Each file is debounced so we don't fight
// Midscene while it's still writing — events arriving within `debounceMs`
// for the same filename reset the timer. The strip itself is idempotent
// (marker in <head> + versioned theme tag), so multiple firings are harmless.
export function watchAndStripReports(reportDir, { debounceMs = 2000 } = {}) {
  try { mkdirSync(reportDir, { recursive: true }); } catch { /* ignore */ }

  const timers = new Map();
  let watcher;
  try {
    watcher = fsWatch(reportDir, { persistent: false }, (_event, filename) => {
      if (!filename || !filename.endsWith('.html')) return;
      if (timers.has(filename)) clearTimeout(timers.get(filename));
      const t = setTimeout(async () => {
        timers.delete(filename);
        await stripOneFile(path.join(reportDir, filename));
      }, debounceMs);
      timers.set(filename, t);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[strip-branding] failed to watch', reportDir, err.message);
    return () => {};
  }

  return () => {
    try { watcher.close(); } catch { /* ignore */ }
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
  };
}

export async function stripBrandingForReports(reportDir, sinceMs = 0) {
  let entries;
  try {
    entries = await fs.readdir(reportDir, { withFileTypes: true });
  } catch {
    return { processed: 0, skipped: 0, errors: 0 };
  }
  let processed = 0, skipped = 0, errors = 0;
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.html')) continue;
    const file = path.join(reportDir, e.name);
    try {
      const stat = await fs.stat(file);
      if (stat.mtimeMs < sinceMs) { skipped++; continue; }
      const html = await fs.readFile(file, 'utf8');
      const out = stripMidsceneBranding(html);
      if (out == null) { skipped++; continue; }
      await fs.writeFile(file, out, 'utf8');
      processed++;
    } catch {
      errors++;
    }
  }
  return { processed, skipped, errors };
}
