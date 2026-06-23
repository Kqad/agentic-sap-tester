// Verify the deck reorder + new KPI image + expanded copy.

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const DECK = path.resolve('SAP_pitch_6.3/deck/index.html');
const OUT  = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto('file:///' + DECK.replace(/\\/g,'/'), { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Verify slide order
async function inspectSlide(n) {
  for (let i = 1; i < n; i++) await page.click('#next');
  await page.waitForTimeout(700);
  const data = await page.evaluate(() => {
    const s = document.querySelector('.slide.active');
    return {
      eyebrow: s.querySelector('.eyebrow')?.textContent?.trim(),
      h: s.querySelector('.h-section')?.textContent?.trim(),
      page: s.querySelector('.rail .page')?.textContent?.trim(),
      img: s.querySelector('.shot img')?.src.split('/').pop(),
      videoSrc: s.querySelector('video')?.src?.split('/').pop(),
      videoRate: s.querySelector('video')?.playbackRate,
      legendCount: s.querySelectorAll('.kpi-legend li').length,
    };
  });
  await page.evaluate(() => document.querySelector('.deck-rail').scrollTop = 0); // reset
  // Reset to first slide for next call
  for (let i = 1; i <= 22; i++) {
    if (await page.evaluate(() => document.getElementById('cur').textContent) === '1') break;
    await page.click('#prev');
  }
  await page.waitForTimeout(200);
  return data;
}

// Slide 7 = Live Demo (run-live.mp4 @ 0.75x)
const s7 = await inspectSlide(7);
console.log('Slide 7:', s7);
console.log(`${/Asset balance|balance verification/i.test(s7.h) ? '✓' : '✗'} Slide 7 is Live Demo`);
console.log(`${s7.videoSrc === 'run-live.mp4' ? '✓' : '✗'} Slide 7 video = run-live.mp4`);
console.log(`${s7.videoRate === 0.75 ? '✓' : '✗'} Slide 7 video @ 0.75x: ${s7.videoRate}`);

// Slide 8 = Parallel Execution
const s8 = await inspectSlide(8);
console.log('\nSlide 8:', s8);
console.log(`${/parallel/i.test(s8.eyebrow) ? '✓' : '✗'} Slide 8 is Parallel Execution`);
console.log(`${s8.videoSrc === 'run-parallel.mp4' ? '✓' : '✗'} Slide 8 video = run-parallel.mp4`);
console.log(`${s8.videoRate === 1 ? '✓' : '✗'} Slide 8 video @ 1x: ${s8.videoRate}`);
console.log(`${s8.page === '08 / 22' ? '✓' : '✗'} Slide 8 footer = 08 / 22 (got ${s8.page})`);

// Slide 9 = Command Center with new image
const s9 = await inspectSlide(9);
console.log('\nSlide 9:', s9);
console.log(`${/command center/i.test(s9.eyebrow) ? '✓' : '✗'} Slide 9 is Command Center`);
console.log(`${s9.img === 'parallel-three-spliced.png' ? '✓' : '✗'} Slide 9 image = parallel-three-spliced.png (got ${s9.img})`);
console.log(`${s9.page === '09 / 22' ? '✓' : '✗'} Slide 9 footer = 09 / 22 (got ${s9.page})`);
console.log(`${s9.legendCount >= 7 ? '✓' : '✗'} Slide 9 has ≥7 legend bullets: ${s9.legendCount}`);
await page.screenshot({ path: path.join(OUT, '56-deck-slide9-command-center.png') });

// Slide 10 must now be Live Broadcast
const s10 = await inspectSlide(10);
console.log('\nSlide 10:', s10);
console.log(`${/live broadcast/i.test(s10.eyebrow) ? '✓' : '✗'} Slide 10 is Live Broadcast`);
console.log(`${s10.page === '10 / 22' ? '✓' : '✗'} Slide 10 footer = 10 / 22 (got ${s10.page})`);

await page.screenshot({ path: path.join(OUT, '56-deck-slide8-parallel.png') }); // current view
const real = errs.filter(e => !/play\(\)|404|favicon|interrupted/.test(e));
console.log(`\nConsole errors: ${real.length}`);
real.forEach(e => console.log('  ✗', e));
await browser.close();
process.exit(real.length ? 1 : 0);
