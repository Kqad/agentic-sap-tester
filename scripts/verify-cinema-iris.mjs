// 1. LIVE button hidden when no active run for the case
// 2. Iris transition wired: cmIrisOpen + cmZoomSettle + light-sweep gloss

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const OUT = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
await ctx.addCookies([{ name:'saptest_session', value: TOKEN, domain:'localhost', path:'/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

// 1) Visit a case with no active run — LIVE button must be absent
await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.locator('.wb-case-item[data-case-id="saptest1"]').click();
await page.waitForTimeout(700);

const liveBtnCount = await page.locator('.wb-actions-bar .btn.cinema-btn').count();
console.log(`${liveBtnCount === 0 ? '✓' : '✗'} LIVE button hidden when no active run: ${liveBtnCount} (expected 0)`);

await page.screenshot({ path: path.join(OUT, '38-no-live-button.png'), fullPage: true });

// 2) Inspect the keyframes to confirm iris animation is active
const animDetails = await page.goto(BASE + '/#/cinema/saptest1', { waitUntil: 'networkidle' }).then(async () => {
  await page.waitForTimeout(1800);
  return await page.evaluate(() => {
    const out = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.name === 'cmIrisOpen' || rule.name === 'cmKenBurns' || rule.name === 'cmZoomSettle' || rule.name === 'cmLightSweep') {
            let txt = '';
            for (const r of rule.cssRules) txt += r.cssText + ' ';
            out[rule.name] = txt;
          }
        }
      } catch {}
    }
    return out;
  });
});

console.log(`${animDetails.cmIrisOpen ? '✓' : '✗'} cmIrisOpen keyframe present: ${animDetails.cmIrisOpen ? 'YES (uses clip-path)' : 'NO'}`);
console.log(`${/clip-path/.test(animDetails.cmIrisOpen || '') ? '✓' : '✗'} cmIrisOpen uses clip-path: ${/clip-path/.test(animDetails.cmIrisOpen || '')}`);
console.log(`${animDetails.cmKenBurns ? '✓' : '✗'} cmKenBurns present (Ken Burns drift on old): ${!!animDetails.cmKenBurns}`);
console.log(`${animDetails.cmZoomSettle ? '✓' : '✗'} cmZoomSettle present (new image zoom-out): ${!!animDetails.cmZoomSettle}`);
console.log(`${animDetails.cmLightSweep ? '✓' : '✗'} cmLightSweep present (projector gloss): ${!!animDetails.cmLightSweep}`);

// 3) Verify the .is-transitioning class can be applied + the ::before fires
const sweepOk = await page.evaluate(() => {
  const f = document.querySelector('.cinema-frame');
  if (!f) return { ok: false };
  f.classList.add('is-transitioning');
  const before = getComputedStyle(f, '::before');
  return {
    ok: true,
    animationName: before.animationName,
    background: before.background.slice(0, 90),
  };
});
console.log(`${sweepOk.animationName === 'cmLightSweep' ? '✓' : '✗'} is-transitioning fires cmLightSweep: ${sweepOk.animationName}`);

// 4) Simulate a real transition: trigger paintFrame to a different step
await page.evaluate(() => {
  // Jump to a different filmstrip thumb to trigger transition
  const thumbs = document.querySelectorAll('.cm-strip-thumb');
  for (const t of thumbs) {
    const img = t.querySelector('img');
    if (img && !t.classList.contains('is-active')) { t.click(); break; }
  }
});
await page.waitForTimeout(300); // mid-transition
await page.screenshot({ path: path.join(OUT, '39-iris-mid.png'), fullPage: true });
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, '40-iris-end.png'), fullPage: true });

console.log(`\nConsole errors: ${errs.length}`);
errs.forEach(e => console.log('  ✗', e));
await browser.close();
process.exit((errs.length || liveBtnCount !== 0 || !animDetails.cmIrisOpen) ? 1 : 0);
