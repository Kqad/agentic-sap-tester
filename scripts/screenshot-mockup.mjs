// Take screenshots of the flow mockup in three states so the user can
// preview without manually clicking.
import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const OUT = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/docs/flow-mockup.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Idle (initial state — all pending)
  await page.screenshot({ path: path.join(OUT, 'mockup-1-idle.png'), fullPage: true });
  console.log('saved mockup-1-idle.png');

  // 2. Mid-run (start, wait ~3s)
  await page.locator('button:has-text("Run cached")').click();
  await page.waitForTimeout(2400);
  await page.screenshot({ path: path.join(OUT, 'mockup-2-running.png'), fullPage: true });
  console.log('saved mockup-2-running.png');

  // 3. Final (wait for finish — total = 800 + (10*320) + (1*900) ≈ 4900ms)
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(OUT, 'mockup-3-final.png'), fullPage: true });
  console.log('saved mockup-3-final.png');

  // 4. Zoom view of one card
  await page.locator('.flow-card').nth(2).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'mockup-4-zoom.png'), fullPage: true });
  console.log('saved mockup-4-zoom.png');

  await browser.close();
})().catch((e) => { console.error('Crashed:', e); process.exit(2); });
