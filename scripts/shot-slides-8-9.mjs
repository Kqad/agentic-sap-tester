import { chromium } from 'playwright';
import path from 'node:path';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto('file:///' + path.resolve('SAP_pitch_6.3/deck/index.html').replace(/\\/g,'/'), { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
for (let i = 1; i < 8; i++) await page.click('#next');
await page.waitForTimeout(1100);
await page.screenshot({ path: 'run-history/ui-verify/57-slide08-parallel.png' });
await page.click('#next');
await page.waitForTimeout(900);
await page.screenshot({ path: 'run-history/ui-verify/57-slide09-command-center.png' });
await browser.close();
console.log('ok');
