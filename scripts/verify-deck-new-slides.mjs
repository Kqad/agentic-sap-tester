// Visual + structural check of the two new slides in the pitch deck.
//   Slide 13 — Command Center / KPI dashboard
//   Slide 18 — Parallel Execution
// Also asserts:
//   · total slide count = 22
//   · rail has 22 thumbs
//   · run-live video defaults to 0.75 playbackRate
//   · run-parallel video defaults to 1.0 playbackRate

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const DECK = path.resolve('SAP_pitch_6.3/deck/index.html');
const OUT = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

const url = 'file:///' + DECK.replace(/\\/g, '/');
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const counts = await page.evaluate(() => ({
  slides: document.querySelectorAll('.slide').length,
  thumbs: document.querySelectorAll('.rail-thumb').length,
  total: document.getElementById('tot')?.textContent,
}));
console.log(`${counts.slides === 22 ? '✓' : '✗'} Slide count = 22: ${counts.slides}`);
console.log(`${counts.thumbs === 22 ? '✓' : '✗'} Rail thumb count = 22: ${counts.thumbs}`);
console.log(`${counts.total === '22' ? '✓' : '✗'} Counter shows 22: ${counts.total}`);

// Jump to slide 7 (live demo) — check video default rate
for (let i = 1; i < 7; i++) await page.click('#next');
await page.waitForTimeout(1100);
const liveRate = await page.evaluate(() => {
  const v = document.querySelector('.slide.active video');
  return v ? v.playbackRate : null;
});
console.log(`${liveRate === 0.75 ? '✓' : '✗'} Slide 7 (live demo) video rate = 0.75x: ${liveRate}`);

// Jump to slide 13 — command center
for (let i = 7; i < 13; i++) await page.click('#next');
await page.waitForTimeout(800);
const cc = await page.evaluate(() => {
  const s = document.querySelector('.slide.active');
  return {
    title: s.querySelector('.h-section')?.textContent?.trim(),
    page: s.querySelector('.rail .page')?.textContent,
    img: s.querySelector('.shot img')?.src.split('/').pop(),
    eyebrow: s.querySelector('.eyebrow')?.textContent,
  };
});
console.log(`${/command center/i.test(cc.eyebrow) ? '✓' : '✗'} Slide 13 is Command Center — eyebrow: "${cc.eyebrow}"`);
console.log(`  title: "${cc.title}"`);
console.log(`  page footer: "${cc.page}"`);
console.log(`${cc.img === 'kpi-dashboard.png' ? '✓' : '✗'} Slide 13 image = kpi-dashboard.png (got ${cc.img})`);
await page.screenshot({ path: path.join(OUT, '55-deck-slide13-command-center.png') });

// Jump to slide 18 — parallel
for (let i = 13; i < 18; i++) await page.click('#next');
await page.waitForTimeout(1100);
const par = await page.evaluate(() => {
  const s = document.querySelector('.slide.active');
  const v = s.querySelector('video');
  return {
    title: s.querySelector('.h-section')?.textContent?.trim(),
    page: s.querySelector('.rail .page')?.textContent,
    src: v?.src.split('/').pop(),
    rate: v?.playbackRate,
    eyebrow: s.querySelector('.eyebrow')?.textContent,
  };
});
console.log(`${/parallel/i.test(par.eyebrow) ? '✓' : '✗'} Slide 18 is Parallel — eyebrow: "${par.eyebrow}"`);
console.log(`  title: "${par.title}"`);
console.log(`  page footer: "${par.page}"`);
console.log(`${par.src === 'run-parallel.mp4' ? '✓' : '✗'} Slide 18 video = run-parallel.mp4 (got ${par.src})`);
console.log(`${par.rate === 1 ? '✓' : '✗'} Slide 18 video rate = 1.0x: ${par.rate}`);
await page.screenshot({ path: path.join(OUT, '55-deck-slide18-parallel.png') });

// Verify last slide is "22 / 22"
for (let i = 18; i < 22; i++) await page.click('#next');
await page.waitForTimeout(400);
const last = await page.evaluate(() => document.querySelector('.slide.active .rail .page')?.textContent);
console.log(`${last === '22 / 22' ? '✓' : '✗'} Last slide footer = "22 / 22" (got "${last}")`);

const real = errs.filter(e => !/404|favicon/.test(e));
console.log(`\nConsole errors: ${real.length}`);
real.forEach(e => console.log('  ✗', e));
await browser.close();
process.exit(real.length ? 1 : 0);
