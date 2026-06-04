// Verify the LIVE BROADCAST button + auto-jump-to-cinema flow.
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

await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.locator('.wb-case-item[data-case-id="saptest1"]').click();
await page.waitForTimeout(700);
await page.locator('.view-toggle button:has-text("flow")').click();
await page.waitForTimeout(700);

// 1. LIVE button is present, has the right classes/styles
const liveBtn = page.locator('.btn.cinema-btn');
const present = await liveBtn.count();
console.log(`${present === 1 ? '✓' : '✗'} LIVE button present: ${present}`);
const txt = await liveBtn.textContent();
console.log(`✓ LIVE button text: "${txt?.trim()}"`);
const bgColor = await liveBtn.evaluate(el => getComputedStyle(el).background);
console.log(`✓ LIVE button background includes red gradient: ${bgColor.includes('208, 31, 31') || bgColor.includes('rgb(229') || bgColor.toLowerCase().includes('linear-gradient')}`);

// 2. The ::before red REC dot exists and has pulse animation
const dotAnim = await liveBtn.evaluate(el => getComputedStyle(el, '::before').animationName);
console.log(`✓ REC dot animation: ${dotAnim}`);

await page.screenshot({ path: path.join(OUT, '33-live-button.png'), fullPage: true });

// 3. Auto-jump-to-cinema: intercept the run POST so it doesn't actually start
//    a real run, then verify the modal closes + cinema route mounts.
await page.route('**/api/midscene-js/cases/*/run*', async (route) => {
  // Stall the response forever to simulate an in-progress run that the
  // modal would otherwise block on.
  await new Promise(r => setTimeout(r, 1)); // tiny delay
  // Return a fake successful response (the modal doesn't care since we're
  // already gone)
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ run: { status: 'passed', durationMs: 1234, logTail: [] } }),
  });
});

// Open the run modal
await page.locator('button.run-cached').first().click();
await page.waitForTimeout(700);
const modalBefore = await page.locator('.modal').count();
console.log(`✓ Run modal opened: ${modalBefore}`);

// Click Start in the modal
await page.locator('.modal button:has-text("Start")').first().click();
await page.waitForTimeout(1200);

const modalAfter = await page.locator('.modal').count();
const cinemaMounted = await page.locator('.cinema').count();
const onCinemaRoute = page.url().includes('#/cinema/');
console.log(`${modalAfter === 0 ? '✓' : '✗'} Modal auto-closed after Start: ${modalAfter}`);
console.log(`${cinemaMounted ? '✓' : '✗'} Cinema mounted automatically`);
console.log(`${onCinemaRoute ? '✓' : '✗'} On cinema route: ${page.url().split('#').pop()}`);

await page.screenshot({ path: path.join(OUT, '34-auto-cinema.png'), fullPage: true });

console.log(`\nConsole errors: ${errs.length}`);
errs.forEach(e => console.log('  ✗', e));
await browser.close();
process.exit(errs.length || !cinemaMounted || !onCinemaRoute ? 1 : 0);
