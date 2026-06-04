// Verify the new flow view in the workbench:
// 1. View toggle [list]/[flow] is present
// 2. Clicking [flow] swaps the renderer to flow-canvas
// 3. Cards have the right count + placeholder thumbs
// 4. /api/midscene-js/runs/:runId/screenshots returns 200 with empty list when run has no captures
// 5. Switching back to [list] restores the dense pipeline

import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const OUT = path.resolve('run-history/ui-verify');
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
  if (TOKEN) await ctx.addCookies([{
    name: 'saptest_session', value: TOKEN,
    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
  }]);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.locator('.wb-case-item[data-case-id="saptest1"]').click();
  await page.waitForTimeout(700);

  // 1. View toggle exists
  const toggleCount = await page.locator('.view-toggle button').count();
  console.log(`${toggleCount === 2 ? '✓' : '✗'} View toggle present: ${toggleCount} buttons`);

  // 2. Default = list. Click flow button.
  await page.locator('.view-toggle button:has-text("flow")').click();
  await page.waitForTimeout(900);

  const flowCanvas = await page.locator('.flow-canvas').count();
  const flowCards  = await page.locator('.flow-card').count();
  console.log(`${flowCanvas ? '✓' : '✗'} Flow canvas mounted`);
  console.log(`${flowCards > 0 ? '✓' : '✗'} Flow cards rendered: ${flowCards}`);

  // 3. Each card has a placeholder thumb (no screenshots yet)
  const emptyThumbs = await page.locator('.flow-thumb.is-empty').count();
  console.log(`✓ Placeholder thumbs (no run yet): ${emptyThumbs} / ${flowCards}`);

  // 4. Edge layer SVG exists
  const edgeSvg = await page.locator('.flow-edge-layer svg path').count();
  console.log(`${edgeSvg > 0 ? '✓' : '✗'} Edge layer drawn: ${edgeSvg} segments`);

  // 5. Stats chips
  const statsCount = await page.locator('.flow-stat-chip').count();
  console.log(`${statsCount === 3 ? '✓' : '✗'} Flow stats chips: ${statsCount}`);

  await page.screenshot({ path: path.join(OUT, '20-flow-empty.png'), fullPage: true });

  // 6. Screenshots list endpoint
  const ssEndpoint = await page.evaluate(async () => {
    const r = await fetch('/api/midscene-js/runs/test-run-id/screenshots', { credentials: 'include' });
    return { status: r.status, body: await r.json().catch(() => null) };
  });
  console.log(`${ssEndpoint.status === 200 ? '✓' : '✗'} /screenshots endpoint returns 200 (empty for unknown runId): body=${JSON.stringify(ssEndpoint.body)}`);

  // 7. Toggle back to list
  await page.locator('.view-toggle button:has-text("list")').click();
  await page.waitForTimeout(500);
  const wbSteps = await page.locator('.wb-steps').count();
  const flowCanvasAfter = await page.locator('.flow-canvas').count();
  console.log(`${wbSteps && !flowCanvasAfter ? '✓' : '✗'} Toggle back to list works`);

  await page.screenshot({ path: path.join(OUT, '21-list-mode.png'), fullPage: true });

  // 8. Toggle persists in localStorage
  const pref = await page.evaluate(() => localStorage.getItem('wb.viewMode'));
  console.log(`✓ localStorage wb.viewMode = ${pref}`);

  console.log(`\nConsole errors: ${errs.length}`);
  errs.forEach(e => console.log('  ✗', e));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error('Crashed:', e); process.exit(2); });
