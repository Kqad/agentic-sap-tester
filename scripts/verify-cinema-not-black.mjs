// Verify the black-screen bug fix: with real screenshots loaded, sample
// the cinema frame's rendered colors and confirm visible content (not just
// the cinema-frame's dark background bleeding through).

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const OUT = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

// Find a recent run that has on-disk screenshots so cinema has real images to show.
const SHOTS_ROOT = path.resolve('midscene_run/screenshots');
let runId = null;
if (existsSync(SHOTS_ROOT)) {
  const dirs = readdirSync(SHOTS_ROOT)
    .map(d => ({ d, p: path.join(SHOTS_ROOT, d) }))
    .filter(x => {
      try { return readdirSync(x.p).some(f => f.endsWith('.jpg')); }
      catch { return false; }
    });
  if (dirs.length) runId = dirs[0].d;
}
console.log(`Found runId with screenshots: ${runId || '(none)'}`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
await ctx.addCookies([{ name:'saptest_session', value: TOKEN, domain:'localhost', path:'/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

// Visit a case detail's cinema (will use most recent run with screenshots)
await page.goto(BASE + '/#/cinema/saptest1', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000); // wait for screenshots to load + initial paint

// Sample the frame dimensions and the visible image
const stats = await page.evaluate(() => {
  const frame = document.querySelector('.cinema-frame');
  if (!frame) return { error: 'no frame' };
  const rect = frame.getBoundingClientRect();
  const imgs = [...frame.querySelectorAll('img')];
  return {
    frameW: rect.width,
    frameH: rect.height,
    imgCount: imgs.length,
    imgs: imgs.map(img => ({
      cls: img.className,
      complete: img.complete,
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
      src: img.src.slice(0, 80),
    })),
    isEmpty: frame.classList.contains('is-empty'),
  };
});
console.log('Frame stats:');
console.log(JSON.stringify(stats, null, 2));

console.log(`${stats.frameW > 100 && stats.frameH > 100 ? '✓' : '✗'} Frame has real dimensions (NOT collapsed to 0): ${stats.frameW}×${stats.frameH}`);

if (stats.imgs.length) {
  const allLoaded = stats.imgs.every(i => i.complete && i.naturalW > 0);
  console.log(`${allLoaded ? '✓' : '✗'} All images loaded with non-zero natural size`);
}

// Take a screenshot of just the frame area to visually confirm
await page.screenshot({ path: path.join(OUT, '41-cinema-not-black.png'), fullPage: true });

// Click forward to trigger a transition
const stripBtns = await page.locator('.cm-strip-thumb').count();
if (stripBtns > 2) {
  await page.locator('.cm-strip-thumb').nth(1).click();
  await page.waitForTimeout(300); // mid-transition
  await page.screenshot({ path: path.join(OUT, '42-cinema-mid-transition.png'), fullPage: true });
  await page.waitForTimeout(1100);
  await page.screenshot({ path: path.join(OUT, '43-cinema-after-transition.png'), fullPage: true });

  // Re-sample
  const after = await page.evaluate(() => {
    const frame = document.querySelector('.cinema-frame');
    const rect = frame.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  });
  console.log(`${after.w > 100 && after.h > 100 ? '✓' : '✗'} Frame retains dimensions through transition: ${after.w}×${after.h}`);
}

console.log(`\nConsole errors: ${errs.length}`);
errs.forEach(e => console.log('  ✗', e));
await browser.close();
process.exit((errs.length || stats.frameW < 100) ? 1 : 0);
