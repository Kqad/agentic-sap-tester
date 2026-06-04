// Verify two fixes:
//   1. Frame transition never goes black — at any sampled moment during
//      a transition, at least one image element must have opacity > 0.5
//   2. Clicking Run in the modal opens cinema in a NEW TAB (window.open),
//      while the original tab stays on the workbench.

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

// 1) Verify keyframes are now "always-visible"
await page.goto(BASE + '/#/cinema/saptest1', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

const animState = await page.evaluate(() => {
  const out = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.name === 'cmKenBurnsOld' || rule.name === 'cmDissolveIn' || rule.name === 'cmIrisOpen') {
          let txt = '';
          for (const r of rule.cssRules) txt += r.cssText + ' ';
          out[rule.name] = txt;
        }
      }
    } catch {}
  }
  return out;
});
console.log(`${animState.cmKenBurnsOld ? '✓' : '✗'} cmKenBurnsOld present (old image stays via scale only): ${!!animState.cmKenBurnsOld}`);
console.log(`${animState.cmDissolveIn ? '✓' : '✗'} cmDissolveIn present (new image pure opacity fade): ${!!animState.cmDissolveIn}`);
console.log(`${!animState.cmIrisOpen ? '✓' : '✗'} cmIrisOpen REMOVED (no more clip-path blackout): ${!animState.cmIrisOpen}`);
const oldHasOpacityChange = /opacity/.test(animState.cmKenBurnsOld || '');
console.log(`${!oldHasOpacityChange ? '✓' : '✗'} cmKenBurnsOld doesn't change opacity (stays visible underneath)`);

// 2) Simulate a transition by inserting two img layers manually and
//    sampling computed opacity at various times during the animation.
const samples = await page.evaluate(async () => {
  const frame = document.querySelector('.cinema-frame');
  if (!frame) return null;
  // Inject two test images (1x1 data URIs of different colors)
  frame.innerHTML = '';
  const oldImg = document.createElement('img');
  oldImg.className = 'cm-fade-old';
  oldImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect width="100" height="60" fill="green"/></svg>');
  const newImg = document.createElement('img');
  newImg.className = 'cm-fade-new';
  newImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect width="100" height="60" fill="blue"/></svg>');
  frame.appendChild(oldImg);
  frame.appendChild(newImg);
  frame.classList.add('is-transitioning');
  // Sample opacities at 0ms, 200ms, 500ms, 900ms after start
  const samples = [];
  for (const ms of [0, 200, 500, 900]) {
    await new Promise(r => setTimeout(r, ms === 0 ? 16 : ms - (samples.length > 0 ? samples[samples.length - 1].t : 0)));
    const oOp = Number(getComputedStyle(oldImg).opacity);
    const nOp = Number(getComputedStyle(newImg).opacity);
    samples.push({ t: ms, oldOpacity: oOp, newOpacity: nOp, sum: oOp + nOp });
  }
  return samples;
});
console.log('Transition opacity samples (sum should always > 0.8):');
let allOk = true;
for (const s of samples) {
  const ok = s.sum > 0.8;
  console.log(`  t=${s.t}ms  old=${s.oldOpacity.toFixed(2)}  new=${s.newOpacity.toFixed(2)}  sum=${s.sum.toFixed(2)}  ${ok ? '✓' : '✗ BLACK'}`);
  if (!ok) allOk = false;
}
console.log(`${allOk ? '✓' : '✗'} No black-screen window during transition`);

// 3) New-tab behavior. Visit workbench → trigger Run → verify a 2nd page opens
await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.locator('.wb-case-item[data-case-id="saptest1"]').click();
await page.waitForTimeout(700);

// Intercept the run POST so we don't actually start anything
await page.route('**/api/midscene-js/cases/*/run*', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ run: { status: 'passed', durationMs: 1000, logTail: [] } }),
  });
});

await page.locator('button.run-cached').first().click();
await page.waitForTimeout(700);

// Capture new-tab opens
const pagesBefore = ctx.pages().length;
const [popup] = await Promise.all([
  ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null),
  page.locator('.modal button:has-text("Start")').first().click(),
]);
await page.waitForTimeout(800);
const pagesAfter = ctx.pages().length;
console.log(`${popup ? '✓' : '✗'} New tab opened for cinema: ${popup ? popup.url() : 'NOT OPENED'}`);
console.log(`${pagesAfter > pagesBefore ? '✓' : '✗'} Tab count grew: ${pagesBefore} → ${pagesAfter}`);
const originalStaysOnWb = page.url().endsWith('#/cases/saptest1') || page.url().endsWith('#/dashboard');
console.log(`${originalStaysOnWb ? '✓' : '✗'} Original tab stayed on workbench: ${page.url().split('#').pop()}`);

console.log(`\nConsole errors: ${errs.length}`);
errs.forEach(e => console.log('  ✗', e));
await browser.close();
process.exit((errs.length || !allOk || !popup) ? 1 : 0);
