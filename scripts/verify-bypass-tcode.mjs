// Verify the new step-row bypass-cache column + clickable T Code warn pill.
// 1. Land on workbench, saptest1 selected
// 2. Confirm bypass checkboxes appear on every step row
// 3. Confirm drag-like steps (aiAct/aiScroll) come pre-checked
// 4. Toggle a bypass on a normal step; open Run modal; confirm the same step
//    is pre-checked in the modal (seededBypass passthrough works)
// 5. Click the T Code ⚠ in the inline param header; confirm explainer opens

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const OUT = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

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
  await page.locator('.wb-case-item[data-case-id="saptest1"]').click();
  await page.waitForTimeout(700);

  // 1. Every step has a bypass label
  const stepRows = await page.locator('.wb-step').count();
  const bypassLabels = await page.locator('.wb-step .wb-step-bypass').count();
  console.log(`✓ Step rows: ${stepRows}  ·  bypass labels: ${bypassLabels}  (should match)`);

  // 2. Drag-like steps (the slider/scroll ones) come pre-checked
  const presChecked = await page.locator('.wb-step .wb-step-bypass input[type=checkbox]:checked').count();
  const dragPresent = await page.locator('.wb-step-bypass.is-drag-default').count();
  console.log(`✓ Bypass checked on load: ${presChecked} (drag-default rows: ${dragPresent})`);

  // 3. Toggle bypass on a non-drag step (pick step 8 — company code)
  const step8 = page.locator('.wb-step[data-step-order="8"] .wb-step-bypass input[type=checkbox]');
  const wasChecked = await step8.isChecked();
  await step8.click();
  const nowChecked = await step8.isChecked();
  console.log(`✓ Step 8 bypass toggled: ${wasChecked} → ${nowChecked}`);

  await page.screenshot({ path: path.join(OUT, '10-bypass-toggled.png'), fullPage: true });

  // 4. Click Run (cached) — modal opens with same checkbox state seeded
  await page.locator('button:has-text("缓存重放"), button:has-text("Cached")').first().click();
  await page.waitForTimeout(700);
  const modalOpen = await page.locator('.modal').count();
  console.log(`${modalOpen ? '✓' : '✗'} Run modal opened`);
  if (modalOpen) {
    // The modal step list is a <li data-step-order=…> with a checkbox inside.
    const modalStep8Check = page.locator('.modal li[data-step-order="8"] input[type=checkbox]');
    const seeded = await modalStep8Check.isChecked();
    console.log(`${seeded === nowChecked ? '✓' : '✗'} Modal step 8 seeded from workbench: ${seeded} (expected ${nowChecked})`);
    await page.screenshot({ path: path.join(OUT, '11-modal-seeded.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // 5. Click the T Code ⚠ pill in the inline param editor
  const tcodeWarn = page.locator('.wb-tcode-warn');
  const tcodeCount = await tcodeWarn.count();
  console.log(`✓ T Code warn pill count in param editor: ${tcodeCount}`);
  if (tcodeCount) {
    await tcodeWarn.first().click();
    await page.waitForTimeout(400);
    const explainerOpen = await page.locator('.wb-explainer').count();
    const title = await page.locator('.modal-head').first().textContent();
    console.log(`${explainerOpen ? '✓' : '✗'} T Code explainer opened — title: ${title?.trim().slice(0, 50)}`);
    await page.screenshot({ path: path.join(OUT, '12-tcode-explainer.png'), fullPage: true });
    await page.keyboard.press('Escape');
  }

  console.log(`\nConsole errors: ${errs.length}`);
  errs.forEach(e => console.log('  ✗', e));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error('Crashed:', e); process.exit(2); });
