// Walk every saptest case in the workbench and verify:
// 1. The step pipeline shows bypass-cache checkboxes for every step
// 2. Drag-like steps (aiAct/aiScroll) come pre-checked
// 3. The seeded bypass values carry through to the Run-cached modal
//
// This catches the "only saptest1 works" regression the user reported.

import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const CASES = ['saptest1','saptest2','saptest3','saptest4','saptest5','saptest6','saptest7','saptest8'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
  if (TOKEN) await ctx.addCookies([{
    name: 'saptest_session', value: TOKEN,
    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
  }]);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

  await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  let allOk = true;

  for (const id of CASES) {
    process.stdout.write(`\n── ${id} ──\n`);
    const item = page.locator(`.wb-case-item[data-case-id="${id}"]`);
    if (!(await item.count())) { console.log(`  skip (not in list)`); continue; }
    await item.click();
    await page.waitForTimeout(700);

    const stepCount = await page.locator('.wb-step').count();
    const bypassCount = await page.locator('.wb-step .wb-step-bypass').count();
    const dragDefault = await page.locator('.wb-step-bypass.is-drag-default').count();
    const onByDefault = await page.locator('.wb-step .wb-step-bypass input[type=checkbox]:checked').count();
    console.log(`  steps=${stepCount}  bypass-labels=${bypassCount}  drag-default=${dragDefault}  pre-checked=${onByDefault}`);
    if (stepCount > 0 && bypassCount !== stepCount) {
      console.log(`  ✗ bypass label count mismatch`); allOk = false;
    }
    if (dragDefault > 0 && onByDefault === 0) {
      console.log(`  ✗ drag-default rows are not pre-checked`); allOk = false;
    }

    // Toggle one non-drag bypass, open cached-run modal, verify seeded.
    if (stepCount >= 8) {
      const wbCheckbox = page.locator('.wb-step:not(.is-drag-default) .wb-step-bypass input[type=checkbox]').first();
      const wasChecked = await wbCheckbox.isChecked();
      await wbCheckbox.click();
      const nowChecked = await wbCheckbox.isChecked();
      // Find the step that was toggled
      const toggledOrder = await page.evaluate(() => {
        const cb = document.querySelector('.wb-step:not(.is-drag-default) .wb-step-bypass input[type=checkbox]:checked')
                ?? document.querySelector('.wb-step:not(.is-drag-default) .wb-step-bypass input[type=checkbox]');
        return cb?.closest('.wb-step')?.dataset?.stepOrder;
      });
      console.log(`  toggled step ${toggledOrder}: ${wasChecked} → ${nowChecked}`);

      const cachedBtn = page.locator('button:has-text("Run cached"), button:has-text("缓存"):has-text("重放"), button:has-text("Cached")').first();
      const btnVisible = await cachedBtn.count();
      if (btnVisible) {
        await cachedBtn.click();
        await page.waitForTimeout(700);
        const modalOpen = await page.locator('.modal').count();
        if (modalOpen) {
          const modalCb = page.locator(`.modal li[data-step-order="${toggledOrder}"] input[type=checkbox]`);
          const modalChecked = await modalCb.isChecked().catch(() => null);
          const ok = modalChecked === nowChecked;
          console.log(`  ${ok ? '✓' : '✗'} modal step ${toggledOrder} seeded = ${modalChecked} (workbench was ${nowChecked})`);
          if (!ok) allOk = false;
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        } else {
          console.log(`  ✗ modal didn't open`); allOk = false;
        }
      } else {
        console.log(`  (no Run cached button — case may lack apiGuide)`);
      }
    }
  }

  console.log(`\nConsole errors: ${errs.length}`);
  errs.forEach(e => console.log('  ✗', e));
  await browser.close();
  process.exit(allOk && errs.length === 0 ? 0 : 1);
})().catch((e) => { console.error('Crashed:', e); process.exit(2); });
