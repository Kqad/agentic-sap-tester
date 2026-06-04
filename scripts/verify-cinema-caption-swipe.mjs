// Verify:
//   1. Caption renders below the frame as a sibling (not absolute-overlaid)
//   2. Caption text matches badge format: "step N/M · aiTap: <text>"
//   3. Swipe keyframes: from translateX(100%) → 0 and 0 → -100% (no overlap)

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

await page.goto(BASE + '/#/cinema/saptest1', { waitUntil: 'networkidle' });
await page.waitForTimeout(2800);

// 1. Caption structure + position
const cap = await page.evaluate(() => {
  const c = document.querySelector('.cinema-caption');
  const inner = document.querySelector('.cinema-stage-inner');
  const frame = document.querySelector('.cinema-frame');
  if (!c) return { found: false };
  const cs = getComputedStyle(c);
  return {
    found: true,
    position: cs.position,
    parentSelector: c.parentElement?.className,
    siblingOfFrame: c.previousElementSibling === frame,
    parts: {
      step: c.querySelector('.cm-cap-step')?.textContent,
      sep:  c.querySelector('.cm-cap-sep')?.textContent,
      api:  c.querySelector('.cm-cap-api')?.textContent,
      text: c.querySelector('.cm-cap-text')?.textContent,
    },
  };
});
console.log(`✓ Caption found: ${cap.found}`);
console.log(`${cap.position === 'static' || cap.position === 'relative' ? '✓' : '✗'} Caption no longer absolute-overlaid: position=${cap.position}`);
console.log(`${cap.siblingOfFrame ? '✓' : '✗'} Caption is a sibling of frame: ${cap.siblingOfFrame} (parent=${cap.parentSelector})`);
console.log(`✓ Caption parts:`);
console.log(`     step: "${cap.parts.step}"`);
console.log(`     sep:  "${cap.parts.sep}"`);
console.log(`     api:  "${cap.parts.api}"`);
console.log(`     text: "${cap.parts.text?.slice(0, 60)}"`);
const formatOk = cap.parts.step?.startsWith('step ')
              && cap.parts.sep === '·'
              && /^ai[A-Z]/.test(cap.parts.api)
              && !!cap.parts.text;
console.log(`${formatOk ? '✓' : '✗'} Caption format matches badge: "step X/Y · aiVerb: text"`);

// 2. Swipe keyframes
const keys = await page.evaluate(() => {
  const out = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.type === CSSRule.KEYFRAMES_RULE && ['cmSwipeOutLeft', 'cmSwipeInRight'].includes(rule.name)) {
          let txt = ''; for (const r of rule.cssRules) txt += r.cssText + ' ';
          out[rule.name] = txt;
        }
      }
    } catch {}
  }
  return out;
});
const outOk = /translateX\(0%?\)/.test(keys.cmSwipeOutLeft) && /translateX\(-100%\)/.test(keys.cmSwipeOutLeft);
const inOk  = /translateX\(100%\)/.test(keys.cmSwipeInRight) && /translateX\(0%?\)/.test(keys.cmSwipeInRight);
const noOverlap = !/translateX\(40%\)/.test(keys.cmSwipeInRight) && !/opacity/.test(keys.cmSwipeInRight);
console.log(`${outOk ? '✓' : '✗'} cmSwipeOutLeft: 0 → -100%`);
console.log(`${inOk ? '✓' : '✗'} cmSwipeInRight: 100% → 0`);
console.log(`${noOverlap ? '✓' : '✗'} cmSwipeInRight no overlap (no 40% start, no opacity fade)`);

await page.screenshot({ path: path.join(OUT, '50-caption-below.png'), fullPage: true });

// 3. Trigger an actual swipe by clicking a different thumb, capture mid-swipe
const thumbCount = await page.locator('.cm-strip-thumb').count();
if (thumbCount >= 3) {
  await page.locator('.cm-strip-thumb').nth(2).click();
  await page.waitForTimeout(420); // mid-transition
  await page.screenshot({ path: path.join(OUT, '51-swipe-mid.png'), fullPage: true });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, '52-swipe-end.png'), fullPage: true });
}

console.log(`\nConsole errors: ${errs.filter(e => !/404/.test(e)).length}`);
errs.filter(e => !/404/.test(e)).forEach(e => console.log('  ✗', e));
await browser.close();
process.exit(errs.filter(e => !/404/.test(e)).length ? 1 : 0);
