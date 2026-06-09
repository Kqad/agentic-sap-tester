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
const THEME_VERSION = '5';
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
    /* Highlight the currently-playing / selected step row so the user can
       see at a glance which step is executing. Paired with the inline JS
       below which scrolls it into view on every class change. */
    .task-row.playing,
    .task-row.selected,
    li.task-row.playing,
    li.task-row.selected {
      background-color: #facc15 !important;
      border-left: 6px solid #b45309 !important;
      box-shadow: 0 4px 14px rgba(202, 138, 4, 0.45) !important;
      color: #1f2937 !important;
      scroll-margin-top: 80px;
      scroll-margin-bottom: 80px;
      padding-left: 12px !important;
    }
    .task-row.playing *,
    .task-row.selected * {
      color: #1f2937 !important;
    }
    /* Preserve newlines / whitespace in the report's text-rendering panels
       (act context, params, descriptions, logs). Without this the recovery
       prompts that contain "\\n" and indentation collapse into one giant
       paragraph, making the structured bullets unreadable. */
    html[data-saptest-theme] .description,
    html[data-saptest-theme] .description-content,
    html[data-saptest-theme] .detail-content,
    html[data-saptest-theme] .structured-params,
    html[data-saptest-theme] .structured-params-container,
    html[data-saptest-theme] .log-content,
    html[data-saptest-theme] .info-content,
    html[data-saptest-theme] .summary-text,
    html[data-saptest-theme] .blackboard-main-content {
      white-space: pre-wrap !important;
      word-break: break-word;
    }
  `.replace(/\s+/g, ' ').trim();

  // Script: (1) read `?theme=` from URL or prefers-color-scheme; (2) follow
  // the currently-playing step (scrollIntoView .task-row.playing/.selected);
  // (3) inline data:image attachments as <img> previews (Chrome blocks data:
  // URL navigation but allows <img src=data:>); (4) translate all Chinese
  // text nodes to English via POST /api/translate (cached on server, so
  // most strings round-trip in milliseconds after the first run; includes
  // video-overlay subtitles since they're regular DOM text). Ported from
  // Desktop saptest's ReplayReportFrame.tsx but runs inline in the report
  // HTML itself — no iframe wrapper needed.
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

      var CHINESE_RE = /[\\u4e00-\\u9fff]/;
      var rafId = null;
      function scrollActive() {
        rafId = null;
        var active = document.querySelector('.task-row.playing') || document.querySelector('.task-row.selected');
        if (!active) return;
        try { active.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        catch (e) { active.scrollIntoView(); }
      }
      function requestScroll() {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(scrollActive);
      }

      /* Inline data:image attachments as visible thumbnails. */
      function inlineDataImages() {
        var anchors = document.querySelectorAll('a[href^="data:image"]');
        for (var i = 0; i < anchors.length; i++) {
          var a = anchors[i];
          if (a.dataset.saptestInlined) continue;
          a.dataset.saptestInlined = '1';
          var img = document.createElement('img');
          img.src = a.href;
          img.alt = a.textContent || 'image';
          img.title = (a.textContent || 'image') + ' (click to toggle full size)';
          img.style.cssText = 'max-width:420px;max-height:300px;display:block;margin:6px 0;border:1px solid hsl(var(--saptest-border, 240 5.9% 90%));border-radius:4px;cursor:zoom-in;';
          img.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            if (this.style.maxWidth === 'none') {
              this.style.maxWidth = '420px'; this.style.maxHeight = '300px'; this.style.cursor = 'zoom-in';
            } else {
              this.style.maxWidth = 'none';  this.style.maxHeight = 'none';  this.style.cursor = 'zoom-out';
            }
          });
          a.parentNode.insertBefore(img, a);
          a.style.display = 'none';
        }
      }

      /* Translation client — gated behind the 中/EN toggle. Default = 中
         (untranslated). Click EN → collect Chinese text nodes, post to
         /api/translate, replace. Click 中 → restore original text from
         the per-node WeakMap. */
      var langMode = 'zh';            /* 'zh' (original) | 'en' (translated) */
      var dict = {};                  /* accumulated zh→en */
      var pendingSet = {};            /* Set-like: strings waiting on next /api/translate call */
      var pendingCount = 0;
      var handled = new WeakSet();    /* Text nodes already translated */
      var originals = new WeakMap();  /* TextNode → original nodeValue for revert */
      var allTouchedNodes = [];       /* All text nodes we've ever rewritten (for revert pass) */
      var flushTimer = null;
      var flushInFlight = false;
      var statusBadge = null;

      function showStatus(text, isError) {
        if (!statusBadge) {
          statusBadge = document.createElement('div');
          statusBadge.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;padding:6px 12px;border-radius:999px;font-size:12px;font-family:system-ui,sans-serif;border:1px solid;background:rgba(255,255,255,0.95);backdrop-filter:blur(4px);pointer-events:none;';
          document.body.appendChild(statusBadge);
        }
        statusBadge.textContent = text;
        statusBadge.style.borderColor = isError ? '#fda4af' : '#cbd5e1';
        statusBadge.style.color = isError ? '#9f1239' : '#475569';
        statusBadge.style.display = text ? 'block' : 'none';
      }

      function shouldSkipNode(node) {
        var cur = node.parentNode;
        while (cur && cur.nodeType === 1) {
          var tag = cur.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') return true;
          if (cur.isContentEditable) return true;
          cur = cur.parentNode;
        }
        return false;
      }

      function collectChineseTextNodes(root) {
        var doc = root.ownerDocument || root;
        var walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: function (n) {
            if (!n.nodeValue || !CHINESE_RE.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
            if (handled.has(n)) return NodeFilter.FILTER_REJECT;
            if (shouldSkipNode(n)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        var out = []; var cur = walker.nextNode();
        while (cur) { out.push(cur); cur = walker.nextNode(); }
        return out;
      }

      function applyTranslations(nodes) {
        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          if (handled.has(n)) continue;
          var orig = n.nodeValue || '';
          var trimmed = orig.trim();
          if (!trimmed) continue;
          var direct = dict[trimmed];
          if (direct && direct !== trimmed) {
            var lead = orig.match(/^\\s*/)[0];
            var trail = orig.match(/\\s*$/)[0];
            if (!originals.has(n)) { originals.set(n, orig); allTouchedNodes.push(n); }
            n.nodeValue = lead + direct + trail;
            handled.add(n);
            continue;
          }
          /* Substring replacement for mixed strings (zh + numbers + en mixed) */
          var updated = orig; var changed = false;
          for (var key in dict) {
            if (!key || !dict[key] || key === dict[key]) continue;
            if (updated.indexOf(key) !== -1) {
              updated = updated.split(key).join(dict[key]);
              changed = true;
            }
          }
          if (changed && updated !== orig) {
            if (!originals.has(n)) { originals.set(n, orig); allTouchedNodes.push(n); }
            n.nodeValue = updated;
            handled.add(n);
          }
        }
      }

      /* Revert: restore originalText for every node we touched. Used when
         the user flips the toggle back to 中. */
      function revertTranslations() {
        for (var i = 0; i < allTouchedNodes.length; i++) {
          var n = allTouchedNodes[i];
          var orig = originals.get(n);
          if (typeof orig === 'string') {
            try { n.nodeValue = orig; } catch (e) {}
          }
          handled.delete(n);
        }
      }

      function scheduleTranslate() {
        if (!document.body) return;
        if (langMode !== 'en') return; /* only translate when user opted in */
        var nodes = collectChineseTextNodes(document.body);
        if (nodes.length === 0) return;
        applyTranslations(nodes);
        var remaining = [];
        for (var i = 0; i < nodes.length; i++) if (!handled.has(nodes[i])) remaining.push(nodes[i]);
        if (remaining.length === 0) return;
        for (var j = 0; j < remaining.length; j++) {
          var txt = (remaining[j].nodeValue || '').trim();
          if (!txt || dict[txt]) continue;
          if (!pendingSet[txt]) { pendingSet[txt] = 1; pendingCount++; }
        }
        if (pendingCount === 0) return;
        if (flushInFlight) return;
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(flush, 150);
      }

      function flush() {
        if (flushInFlight || pendingCount === 0) return;
        flushInFlight = true; flushTimer = null;
        showStatus('Translating to English…', false);
        var lastError = null;
        function loop() {
          if (pendingCount === 0) { done(); return; }
          var slice = Object.keys(pendingSet);
          pendingSet = {}; pendingCount = 0;
          fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strings: slice })
          }).then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok, j: j }; }); })
            .then(function (res) {
              var translations = (res.j && res.j.translations) || {};
              for (var k in translations) dict[k] = translations[k];
              if (!res.ok) lastError = (res.j && res.j.error) || ('HTTP ' + res.j);
              applyTranslations(collectChineseTextNodes(document.body));
              loop();
            }).catch(function (err) {
              lastError = err && err.message ? err.message : String(err);
              loop();
            });
        }
        function done() {
          flushInFlight = false;
          if (lastError && Object.keys(dict).length === 0) {
            showStatus('Translation unavailable: ' + lastError, true);
          } else {
            showStatus('', false);
          }
          if (pendingCount > 0) { if (flushTimer) clearTimeout(flushTimer); flushTimer = setTimeout(flush, 150); }
        }
        loop();
      }

      /* Floating 中/EN toggle. Default = 中 (original Chinese text shown,
         no fetch to /api/translate). Click to flip — switches to EN and
         kicks off the on-demand translate pipeline; click again returns
         to 中 by restoring original node values. */
      function buildLangToggle() {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Toggle 中 / EN');
        btn.style.cssText = [
          'position:fixed', 'bottom:16px', 'right:16px', 'z-index:99999',
          'padding:8px 14px', 'border-radius:999px', 'font:600 13px system-ui,sans-serif',
          'border:1px solid #cbd5e1', 'background:rgba(255,255,255,0.95)',
          'color:#1f2937', 'cursor:pointer', 'backdrop-filter:blur(4px)',
          'box-shadow:0 4px 14px rgba(0,0,0,0.08)',
        ].join(';');
        function render() {
          btn.textContent = langMode === 'zh' ? '中 → EN' : 'EN → 中';
          btn.title = langMode === 'zh' ? 'Translate all Chinese to English' : '恢复原始中文';
        }
        btn.addEventListener('click', function () {
          if (langMode === 'zh') {
            langMode = 'en';
            render();
            scheduleTranslate();
          } else {
            langMode = 'zh';
            render();
            revertTranslations();
            showStatus('', false);
          }
        });
        render();
        document.body.appendChild(btn);
      }

      function arm() {
        if (!document.body) { setTimeout(arm, 50); return; }
        new MutationObserver(function (records) {
          var classChanged = false;
          var textOrTreeChanged = false;
          for (var i = 0; i < records.length; i++) {
            var r = records[i];
            if (r.type === 'attributes' && r.attributeName === 'class' &&
                r.target.classList && r.target.classList.contains('task-row')) {
              classChanged = true;
            } else if (r.type === 'characterData') {
              /* Text mutated — if it now contains Chinese, retranslate. */
              if (CHINESE_RE.test(r.target.nodeValue || '')) {
                handled.delete(r.target);
                textOrTreeChanged = true;
              }
            } else if (r.type === 'childList') {
              textOrTreeChanged = true;
            }
          }
          if (classChanged) requestScroll();
          if (textOrTreeChanged) { inlineDataImages(); scheduleTranslate(); }
        }).observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true, characterData: true });
        requestScroll();
        inlineDataImages();
        buildLangToggle();
        /* No auto-translate at boot — user opts in via the toggle. */
      }
      arm();
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
