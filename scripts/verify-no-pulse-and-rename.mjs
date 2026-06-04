// Verify two changes:
//   1. List-mode step rows: no wbStepPulse on running indicator, no rail comet
//   2. Case rename: pencil button + modal + PATCH endpoint round-trip

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
await page.waitForTimeout(900);

// 1. Confirm the indicator's wbStepPulse animation is no longer applied
//    when a step is in is-running state.
const pulseGone = await page.evaluate(() => {
  // Inject a fake running state on the first step
  const step = document.querySelector('.wb-step');
  if (!step) return { skip: true };
  step.classList.add('is-running');
  step.classList.remove('is-pending', 'is-passed', 'is-failed');
  const ind = step.querySelector('.wb-step-indicator');
  const animName = getComputedStyle(ind).animationName;
  return { animName };
});
console.log(`${pulseGone.animName === 'none' ? '✓' : '✗'} Running indicator has no animation (was wbStepPulse): "${pulseGone.animName}"`);

// 2. Confirm the rail's ::after comet is no longer rendered as an active element
const cometGone = await page.evaluate(() => {
  const steps = document.querySelector('.wb-steps');
  if (!steps) return { skip: true };
  steps.classList.add('is-active');
  steps.style.setProperty('--rail-progress', '40%');
  steps.style.setProperty('--rail-cursor', '120');
  const after = getComputedStyle(steps, '::after');
  return {
    content: after.content,    // 'none' if no ::after rule
    animationName: after.animationName,
  };
});
console.log(`${cometGone.content === 'none' || cometGone.content === '""' ? '✓' : '✗'} Rail comet ::after removed: content=${cometGone.content}`);

// Take a screenshot to visually confirm
await page.screenshot({ path: path.join(OUT, '46-no-pulse.png'), fullPage: true });

// 3. Rename pencil button exists in detail meta
const pencil = await page.locator('.wb-id-rename').count();
console.log(`${pencil ? '✓' : '✗'} Rename pencil button rendered: ${pencil}`);

// 4. Click pencil → modal opens
await page.locator('.wb-id-rename').first().click();
await page.waitForTimeout(500);
const modal = await page.locator('.modal').count();
console.log(`${modal ? '✓' : '✗'} Rename modal opened: ${modal}`);
await page.screenshot({ path: path.join(OUT, '47-rename-modal.png'), fullPage: true });

// 5. End-to-end rename round-trip — pick a non-saptest1 case so we don't
//    accidentally break the canonical sample. Use a temporary test case.
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// Create a throwaway case via the API
const tmpId = 'rename-probe-' + Math.floor(Math.random() * 1000);
const newId = tmpId + '-renamed';
await page.evaluate(async (id) => {
  await fetch('/api/cases/' + encodeURIComponent(id), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'rename probe', sapUrl: '' }),
  });
}, tmpId);

// PATCH rename
const renameResp = await page.evaluate(async ([oldId, newId]) => {
  const r = await fetch('/api/cases/' + encodeURIComponent(oldId) + '/rename', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newId }),
  });
  return { status: r.status, body: await r.json() };
}, [tmpId, newId]);
console.log(`${renameResp.status === 200 ? '✓' : '✗'} PATCH rename returned 200: status=${renameResp.status}, body=${JSON.stringify(renameResp.body)}`);

// Verify GET of new id works, GET of old id 404s
const verify = await page.evaluate(async ([oldId, newId]) => {
  const oldR = await fetch('/api/cases/' + encodeURIComponent(oldId), { credentials: 'include' });
  const newR = await fetch('/api/cases/' + encodeURIComponent(newId), { credentials: 'include' });
  return { oldStatus: oldR.status, newStatus: newR.status };
}, [tmpId, newId]);
console.log(`${verify.oldStatus === 404 ? '✓' : '✗'} Old id now 404s: ${verify.oldStatus}`);
console.log(`${verify.newStatus === 200 ? '✓' : '✗'} New id loads OK: ${verify.newStatus}`);

// Cleanup — delete the renamed case
await page.evaluate(async (id) => {
  await fetch('/api/cases/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'include' });
}, newId);

console.log(`\nConsole errors: ${errs.length}`);
errs.forEach(e => console.log('  ✗', e));
await browser.close();
process.exit(errs.length ? 1 : 0);
