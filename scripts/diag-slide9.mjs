import { chromium } from 'playwright';
import path from 'node:path';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto('file:///' + path.resolve('SAP_pitch_6.3/deck/index.html').replace(/\\/g,'/'), { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
for (let i = 1; i < 9; i++) await page.click('#next');
await page.waitForTimeout(900);

const info = await page.evaluate(() => {
  const slide = document.querySelector('.slide.active');
  const head = slide.querySelector('.head');
  const shotWrap = slide.querySelector('.shot-wrap');
  const shot = slide.querySelector('.shot');
  const img = slide.querySelector('.shot img');
  const cs = (el) => el ? getComputedStyle(el) : null;
  return {
    slideRect: slide.getBoundingClientRect(),
    headRect: head?.getBoundingClientRect(),
    shotWrapRect: shotWrap?.getBoundingClientRect(),
    shotRect: shot?.getBoundingClientRect(),
    imgRect: img?.getBoundingClientRect(),
    imgNaturalW: img?.naturalWidth,
    imgNaturalH: img?.naturalHeight,
    shotOverflow: cs(shot)?.overflow,
    imgWidth: cs(img)?.width,
    imgHeight: cs(img)?.height,
    imgObjectFit: cs(img)?.objectFit,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
