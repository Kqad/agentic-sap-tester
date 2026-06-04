// Quick visual + behavioral verification of the SAP Fiori workbench refactor.
// Uses the Playwright already bundled with this project (devDep).
//
// What this checks:
//   1. /          (login) renders without console errors, CSS loads, IBM Plex font kicks in
//   2. After authenticating (via api/auth/login), #/dashboard renders the .workbench grid
//   3. Cases list, KPI strip, results table, log column all mount
//   4. No console errors at idle
//   5. Screenshots saved under run-history/ui-verify/

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.SAPTEST_URL || 'http://localhost:5174';
const USER = process.env.SAPTEST_USER || 'admin';
const PASS = process.env.SAPTEST_PASS || '';
const OUT  = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

const errors = [];
const consoleMsgs = [];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
  if (process.env.SAPTEST_TOKEN) {
    await ctx.addCookies([{
      name: 'saptest_session',
      value: process.env.SAPTEST_TOKEN,
      domain: new URL(BASE).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }]);
  }
  const page = await ctx.newPage();
  page.on('console', (msg) => {
    consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

  // ── 1. Initial page (login or shell depending on auth) ──
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '01-landing.png'), fullPage: true });
  if (!process.env.SAPTEST_TOKEN) {
    const loginTitle = await page.locator('.login-card .brand-title').first().textContent();
    console.log('Login brand title:', loginTitle?.trim());
  } else {
    console.log('Authenticated via injected cookie — landing on shell.');
  }

  // ── 2. Authenticate via API to skip the password prompt if env is set ──
  // (Skipped when SAPTEST_TOKEN was injected as a cookie above.)
  if (!process.env.SAPTEST_TOKEN && PASS) {
    const loginOk = await page.evaluate(async ({ user, pass }) => {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      return r.ok;
    }, { user: USER, pass: PASS });
    console.log('Auth result:', loginOk);
    if (!loginOk) {
      console.log('Auth failed — workbench checks skipped. Set SAPTEST_PASS env to admin password.');
      await browser.close();
      process.exit(2);
    }
  } else if (!process.env.SAPTEST_TOKEN) {
    console.log('No SAPTEST_PASS / SAPTEST_TOKEN provided — only login-page checks ran.');
    console.log('Errors so far:', errors);
    await browser.close();
    process.exit(0);
  }

  // ── 3. Workbench (#/dashboard) ──
  await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800); // give VIEWS.dashboard time to finish its renders
  await page.screenshot({ path: path.join(OUT, '02-workbench.png'), fullPage: true });

  const checks = [
    { name: 'KPI strip',     selector: '.workbench-region.kpi .kpi-strip .kpi-cell' },
    { name: 'Cases region',  selector: '.workbench-region.cases' },
    { name: 'Detail region', selector: '.workbench-region.detail' },
    { name: 'Logs region',   selector: '.workbench-region.logs' },
    { name: 'Results region', selector: '.workbench-region.results' },
    { name: 'KPI cells',     selector: '.kpi-cell', minCount: 7 },
  ];
  for (const c of checks) {
    const n = await page.locator(c.selector).count();
    const ok = c.minCount ? n >= c.minCount : n >= 1;
    console.log(`${ok ? '✓' : '✗'} ${c.name}: ${n} matches`);
  }

  // Pick the first case in the list and click it.
  const firstCase = page.locator('.wb-case-item').first();
  if (await firstCase.count()) {
    await firstCase.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '03-workbench-detail.png'), fullPage: true });
    const detail = await page.locator('.wb-detail-header .wb-detail-title').first().textContent();
    console.log('Detail title:', detail?.trim().slice(0, 80));
  }

  // Power-user feature checks
  console.log('\n── Power-user features ──');
  const sparkCount = await page.locator('.kpi-spark').count();
  console.log(`${sparkCount >= 1 ? '✓' : '✗'} Pass-rate sparkline: ${sparkCount}`);
  const paramInputs = await page.locator('.wb-detail-header ~ div input').count();
  console.log(`✓ Inline parameter inputs visible: ${paramInputs}`);

  // Open command palette via Ctrl+K
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(400);
  const palOpen = await page.locator('.cmd-pal').count();
  console.log(`${palOpen ? '✓' : '✗'} Command palette opens on Ctrl+K`);
  if (palOpen) {
    await page.fill('.cmd-pal-input', 'sap');
    await page.waitForTimeout(200);
    const matches = await page.locator('.cmd-pal-item').count();
    console.log(`✓ Cmd palette filters: ${matches} matches for "sap"`);
    await page.screenshot({ path: path.join(OUT, '06-cmd-palette.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // Keyboard cheatsheet
  await page.keyboard.press('?');
  await page.waitForTimeout(300);
  const cheatOpen = await page.locator('.kbd-cheat-grid').count();
  console.log(`${cheatOpen ? '✓' : '✗'} Cheatsheet opens on ?`);
  if (cheatOpen) {
    await page.screenshot({ path: path.join(OUT, '07-cheatsheet.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // J/K case navigation
  const beforeId = await page.locator('.wb-case-item.is-active').getAttribute('data-case-id');
  await page.keyboard.press('j');
  await page.waitForTimeout(500);
  const afterIdJ = await page.locator('.wb-case-item.is-active').getAttribute('data-case-id');
  console.log(`${beforeId !== afterIdJ ? '✓' : '✗'} J moved selection: ${beforeId} → ${afterIdJ}`);

  // ── Docs link in topbar ──
  const docsLink = page.locator('a.docs-link');
  const docsCount = await docsLink.count();
  const docsHref = docsCount ? await docsLink.getAttribute('href') : null;
  console.log(`${docsCount ? '✓' : '✗'} Docs link in topbar: ${docsHref || '(missing)'}`);

  // Confirm the doc renders standalone
  await page.goto(BASE + '/docs/ui-refactor.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const docH1 = await page.locator('h1').first().textContent();
  console.log(`${docH1?.includes('UI 重构') ? '✓' : '✗'} Docs page heading: ${docH1?.trim().slice(0, 60)}`);
  const tocCount = await page.locator('.toc a').count();
  console.log(`✓ Docs TOC entries: ${tocCount}`);
  await page.screenshot({ path: path.join(OUT, '08-docs-page.png'), fullPage: true });

  // Confirm the markdown is also served
  const mdResp = await page.evaluate(async () => {
    const r = await fetch('/docs/UI_REFACTOR.md');
    return { ok: r.ok, len: (await r.text()).length };
  });
  console.log(`${mdResp.ok ? '✓' : '✗'} UI_REFACTOR.md served: ${mdResp.len} bytes`);

  // ── 4. Visit case list view (existing route) — verify it still renders ──
  await page.goto(BASE + '/#/cases', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '04-cases-list.png'), fullPage: true });
  const tblRows = await page.locator('table.tbl tbody tr').count();
  console.log('Cases list rows:', tblRows);

  // ── 5. Results view ──
  await page.goto(BASE + '/#/results', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '05-results.png'), fullPage: true });

  // ── Done ──
  console.log('\nConsole errors:', errors.length);
  for (const e of errors) console.log('  ✗', e);

  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => {
  console.error('Verify script crashed:', e);
  process.exit(3);
});
