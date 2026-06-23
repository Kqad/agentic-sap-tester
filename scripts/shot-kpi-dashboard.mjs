// Capture a single hero shot of the workbench KPI strip for the pitch deck.
// Crops to the top of the dashboard so the rings/sparkline/histogram are
// the dominant content. Saved as deck/assets/kpi-dashboard.png at 2400×750.

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const OUT = path.resolve('SAP_pitch_6.3/deck/assets/kpi-dashboard.png');
mkdirSync(path.dirname(OUT), { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 2400, height: 1400 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name:'saptest_session', value: TOKEN, domain:'localhost', path:'/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();
await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// Crop to: just below the top app bar, height = enough for the strip + a
// strip of cases-list below for context.
const strip = await page.locator('.kpi-strip').boundingBox();
const clipY = Math.max(0, Math.round(strip.y - 56));
const clipH = Math.round(strip.height + 56 + 230);
await page.screenshot({
  path: OUT,
  clip: { x: 0, y: clipY, width: 2400, height: clipH },
});
console.log(`✓ Saved ${OUT}  (clip h=${clipH})`);
await browser.close();
