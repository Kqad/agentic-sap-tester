// Verify the redesigned workbench KPI strip:
//   1. 11 cells (pending restored)
//   2. Time saved shows a non-zero value
//   3. Clicking time-saved cell opens reasoning modal with breakdown rows
//   4. Info dot shown on clickable cells
//   5. No JS console errors

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
await page.waitForTimeout(1400);

const info = await page.evaluate(() => {
  const strip = document.querySelector('.kpi-strip');
  if (!strip) return { found: false };
  const cells = Array.from(strip.querySelectorAll('.kpi-cell'));
  const tsCell = strip.querySelector('.kpi-cell[data-kpi="timeSaved"]');
  const healthCell = strip.querySelector('.kpi-cell[data-kpi="health"]');
  return {
    found: true,
    cellCount: cells.length,
    keys: cells.map(c => c.dataset.kpi),
    pendValue: strip.querySelector('.kpi-cell[data-kpi="pend"] .kpi-num')?.textContent,
    timeSavedValue: tsCell?.querySelector('.kpi-num')?.textContent,
    timeSavedClickable: tsCell?.classList.contains('is-clickable'),
    healthClickable: healthCell?.classList.contains('is-clickable'),
    infoDotCount: strip.querySelectorAll('.kpi-info-dot').length,
  };
});

const expectedKeys = ['total','pass','fail','run','pend','rate','cacheHit','activity','avg','timeSaved','health'];
console.log(`✓ KPI strip found: ${info.found}`);
console.log(`${info.cellCount === 11 ? '✓' : '✗'} Cell count = 11: ${info.cellCount}`);
console.log(`  keys: ${JSON.stringify(info.keys)}`);
console.log(`${expectedKeys.every(k => info.keys.includes(k)) ? '✓' : '✗'} All expected keys present (incl. pend)`);
console.log(`  pending: "${info.pendValue}"`);
console.log(`  time-saved value: "${info.timeSavedValue}"`);
console.log(`${info.timeSavedValue && info.timeSavedValue !== '0s' ? '✓' : '✗'} Time saved is non-zero`);
console.log(`${info.timeSavedClickable ? '✓' : '✗'} Time-saved cell is clickable`);
console.log(`${info.healthClickable ? '✓' : '✗'} Health cell is clickable`);
console.log(`${info.infoDotCount >= 3 ? '✓' : '✗'} Info dots rendered on clickable cells: ${info.infoDotCount}`);

// Click time-saved → modal opens with breakdown
await page.locator('.kpi-cell[data-kpi="timeSaved"]').click();
await page.waitForTimeout(400);
const modal = await page.evaluate(() => {
  const m = document.querySelector('.modal');
  if (!m) return { open: false };
  return {
    open: true,
    title: m.querySelector('.modal-head')?.textContent,
    rowCount: m.querySelectorAll('.kpi-reason-table tr').length,
    hasNote: !!m.querySelector('.kpi-reason-note'),
    hasIntro: !!m.querySelector('.kpi-reason-intro'),
  };
});
console.log(`${modal.open ? '✓' : '✗'} Time-saved click opens modal`);
console.log(`  modal title: "${modal.title}"`);
console.log(`${modal.rowCount >= 5 ? '✓' : '✗'} Reasoning table has ≥5 rows: ${modal.rowCount}`);
console.log(`${modal.hasNote ? '✓' : '✗'} Formula note rendered`);
console.log(`${modal.hasIntro ? '✓' : '✗'} Intro paragraph rendered`);

await page.screenshot({ path: path.join(OUT, '54-kpi-reason-modal.png'), fullPage: false, clip: { x: 0, y: 0, width: 1600, height: 800 } });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

await page.screenshot({ path: path.join(OUT, '54-kpi-strip-final.png'), fullPage: false, clip: { x: 0, y: 0, width: 1600, height: 200 } });

const real = errs.filter(e => !/404/.test(e));
console.log(`\nConsole errors: ${real.length}`);
real.forEach(e => console.log('  ✗', e));
await browser.close();
process.exit(real.length ? 1 : 0);
