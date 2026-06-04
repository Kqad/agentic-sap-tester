// Regression test for the inline-param save sync bug:
//   1. Open workbench, select saptest1
//   2. Find the param input that currently shows the company-code default
//   3. Change it to a new value, click Save
//   4. Verify the step list now reflects the new value
//   5. Verify GET /api/cases/saptest1 has the override in `params`
//   6. Verify the case's `naturalLanguage` has the new value too (NL sync)
//   7. Restore the original value so the case is left untouched

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const OUT = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

const CASE = 'saptest1';
// Pick a non-tcode param (T Code is on step 6 and rotates cacheId — don't
// touch it). saptest1 step 8 is "company code = 8540" which is safe.
const ORIGINAL = '8540';
const TEST_VAL = '99999';

const errs = [];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
  if (TOKEN) await ctx.addCookies([{
    name: 'saptest_session', value: TOKEN,
    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
  }]);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

  // 0. Navigate first (so window has an origin), then capture original case.
  await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const original = await page.evaluate(async (id) => {
    const r = await fetch('/api/cases/' + encodeURIComponent(id), { credentials: 'include' });
    return r.ok ? await r.json() : null;
  }, CASE);
  if (!original) throw new Error('Could not fetch ' + CASE);
  const originalParams = original.parsed.params || {};
  const originalNL = original.parsed.naturalLanguage || '';
  console.log('Original params:', JSON.stringify(originalParams));
  console.log('Original NL head:', originalNL.slice(0, 90).replace(/\n/g, ' ⏎ '));

  // Make sure the case is selected
  const itemSel = `.wb-case-item[data-case-id="${CASE}"]`;
  await page.locator(itemSel).click();
  await page.waitForTimeout(600);

  // 1. Find the param input whose value matches "8540"
  const inputs = page.locator('.wb-detail-header ~ div input');
  const inputCount = await inputs.count();
  let targetIdx = -1;
  for (let i = 0; i < inputCount; i++) {
    const v = await inputs.nth(i).inputValue();
    if (v === ORIGINAL) { targetIdx = i; break; }
  }
  console.log(`Target param input index: ${targetIdx} (looking for value ${ORIGINAL})`);
  if (targetIdx < 0) throw new Error('Could not find the param input with value ' + ORIGINAL);

  // 2. Snapshot the step title that contains the value
  const stepBefore = await page.locator(`.wb-step:has-text("${ORIGINAL}")`).first().textContent();
  console.log(`Step before save: ${stepBefore?.trim().slice(0, 60)}`);

  // 3. Edit + Save
  await inputs.nth(targetIdx).fill(TEST_VAL);
  await page.locator('button:has-text("保存参数"), button:has-text("Save params")').click();
  await page.waitForTimeout(1500); // PUT + refetch + render

  // 4. Snapshot the step title after — the value should be the new one
  const stepAfter = await page.locator(`.wb-step:has-text("${TEST_VAL}")`).first().textContent().catch(() => null);
  const stepOld = await page.locator(`.wb-step:has-text("${ORIGINAL}")`).count();
  console.log(`Step after save: ${(stepAfter || '(missing)').trim().slice(0, 60)}`);
  console.log(`${stepAfter ? '✓' : '✗'} Step title now contains ${TEST_VAL}`);
  // The original 8540 should no longer be in any step — but T Code on step 6
  // is unrelated so we don't strictly assert disappearance.
  console.log(`Steps still containing "${ORIGINAL}": ${stepOld} (any TX-code matches are fine)`);

  await page.screenshot({ path: path.join(OUT, '09-after-save.png'), fullPage: true });

  // 5. Read back the case from the server and verify
  const after = await page.evaluate(async (id) => {
    const r = await fetch('/api/cases/' + encodeURIComponent(id), { credentials: 'include' });
    return r.ok ? await r.json() : null;
  }, CASE);
  const newParams = after.parsed.params || {};
  const newNL = after.parsed.naturalLanguage || '';
  const hasOverride = Object.values(newParams).map(String).includes(TEST_VAL);
  console.log(`${hasOverride ? '✓' : '✗'} Server params has ${TEST_VAL}: ${JSON.stringify(newParams)}`);
  const nlHasNew = newNL.includes(TEST_VAL);
  const nlHasOld = newNL.includes(ORIGINAL);
  console.log(`${nlHasNew ? '✓' : '✗'} NL contains new value ${TEST_VAL}`);
  console.log(`${!nlHasOld ? '✓' : '✗'} NL no longer contains old value ${ORIGINAL}`);
  console.log(`  NL head after: ${newNL.slice(0, 90).replace(/\n/g, ' ⏎ ')}`);

  // 6. RESTORE — important so the case isn't left polluted
  console.log('\nRestoring original case state…');
  await page.evaluate(async ({ id, body }) => {
    await fetch('/api/cases/' + encodeURIComponent(id), {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }, { id: CASE, body: original.parsed });
  const restored = await page.evaluate(async (id) => {
    const r = await fetch('/api/cases/' + encodeURIComponent(id), { credentials: 'include' });
    return r.ok ? await r.json() : null;
  }, CASE);
  const restoredOk = (restored.parsed.naturalLanguage || '').includes(ORIGINAL)
                   && !(restored.parsed.naturalLanguage || '').includes(TEST_VAL);
  console.log(`${restoredOk ? '✓' : '✗'} Case restored cleanly`);

  console.log(`\nConsole errors: ${errs.length}`);
  errs.forEach(e => console.log('  ✗', e));

  await browser.close();
  process.exit(errs.length || !stepAfter || !hasOverride || !nlHasNew ? 1 : 0);
})().catch((e) => { console.error('Crashed:', e); process.exit(2); });
