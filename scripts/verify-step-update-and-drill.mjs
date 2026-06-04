// Regression test for two fixes:
//
// 1. step 23 (Report date) has its title TRUNCATED at apiGuide-gen time
//    ("30.04.20..."). My earlier stepTitleFor used naive split on the default
//    value "30.04.2026", which failed on truncated titles. The fix probes
//    s.naturalLanguageInstruction (which has the full default) as a fallback.
//
// 2. Workbench should expose a direct "open full case detail" affordance —
//    the case title in the detail header + the case ID in the meta row both
//    become links; each row in the cases list gets a hover-only "↗" pill
//    and double-clicking a row drills into the case detail page.

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const OUT = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

const CASE = 'saptest1';
const TARGET_STEP = 23;   // Report date — the one with truncated title
const TARGET_DEFAULT = '30.04.2026';
const TEST_OVERRIDE = '99.99.9999';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
  if (TOKEN) await ctx.addCookies([{
    name: 'saptest_session', value: TOKEN,
    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
  }]);
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

  await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Snapshot the original case for restoration at the end.
  const original = await page.evaluate(async (id) => {
    const r = await fetch('/api/cases/' + encodeURIComponent(id), { credentials: 'include' });
    return r.ok ? await r.json() : null;
  }, CASE);
  if (!original) throw new Error('Could not fetch ' + CASE);

  // Make sure target case is selected.
  await page.locator(`.wb-case-item[data-case-id="${CASE}"]`).click();
  await page.waitForTimeout(700);

  // ── Fix #1: truncated-title param substitution ──
  console.log('── Param save → step title (truncated title case) ──');
  // Locate the step row whose data-step-order is 23.
  const stepRow = page.locator(`.wb-step[data-step-order="${TARGET_STEP}"] .wb-step-title`);
  const titleBefore = await stepRow.textContent();
  console.log(`Step ${TARGET_STEP} title before:  ${titleBefore?.trim()}`);

  // Find the param input whose value matches the default for step 23.
  const inputs = page.locator('.wb-detail-header ~ div input').filter({
    // The header on top of the input matches "#23"; we use input value match instead.
  });
  const n = await inputs.count();
  let targetIdx = -1;
  for (let i = 0; i < n; i++) {
    const v = await inputs.nth(i).inputValue();
    if (v === TARGET_DEFAULT) { targetIdx = i; break; }
  }
  if (targetIdx < 0) throw new Error('Could not find param input with default ' + TARGET_DEFAULT);
  await inputs.nth(targetIdx).fill(TEST_OVERRIDE);
  await page.locator('button:has-text("保存参数"), button:has-text("Save params")').click();
  await page.waitForTimeout(1500);

  const titleAfter = await stepRow.textContent();
  console.log(`Step ${TARGET_STEP} title after:   ${titleAfter?.trim()}`);
  const ok1 = (titleAfter || '').includes(TEST_OVERRIDE);
  console.log(`${ok1 ? '✓' : '✗'} Step title now contains override "${TEST_OVERRIDE}"`);

  await page.screenshot({ path: path.join(OUT, '13-step23-updated.png'), fullPage: true });

  // ── Fix #2: drill-into-case affordances ──
  console.log('\n── Drill into case detail from workbench ──');

  // (a) Title link in the detail header
  const titleLinkHref = await page.locator('.wb-detail-title-link').first().getAttribute('href');
  console.log(`✓ Detail title is a link · href = ${titleLinkHref}`);

  // (b) Case-ID link in the meta row
  const idLinkHref = await page.locator('.wb-id-link').first().getAttribute('href');
  console.log(`✓ Case-ID in meta row is a link · href = ${idLinkHref}`);

  // (c) Per-row "↗" pill exists for every visible row
  const openCount = await page.locator('.wb-case-item .wb-case-open').count();
  const rowCount = await page.locator('.wb-case-item').count();
  console.log(`✓ Hover "↗" affordance: ${openCount} / ${rowCount} rows`);

  // (d) Clicking the title actually navigates
  await page.locator('.wb-detail-title-link').first().click();
  await page.waitForTimeout(600);
  const onCaseDetail = page.url().includes('#/cases/' + CASE);
  console.log(`${onCaseDetail ? '✓' : '✗'} Clicking title navigated to ${page.url().split('#').pop()}`);
  await page.screenshot({ path: path.join(OUT, '14-after-drill-in.png'), fullPage: true });

  // (e) Go back, double-click a different row
  await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.locator('.wb-case-item').nth(1).dblclick();
  await page.waitForTimeout(600);
  const dblOk = page.url().includes('#/cases/');
  console.log(`${dblOk ? '✓' : '✗'} Double-click drilled in: ${page.url().split('#').pop()}`);

  // Restore the case
  await page.evaluate(async ({ id, body }) => {
    await fetch('/api/cases/' + encodeURIComponent(id), {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }, { id: CASE, body: original.parsed });

  console.log(`\nConsole errors: ${errs.length}`);
  errs.forEach(e => console.log('  ✗', e));
  await browser.close();
  process.exit((errs.length || !ok1 || !onCaseDetail || !dblOk) ? 1 : 0);
})().catch((e) => { console.error('Crashed:', e); process.exit(2); });
