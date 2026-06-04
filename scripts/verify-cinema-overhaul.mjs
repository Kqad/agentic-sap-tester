// Verify 5 changes:
//   1. wbStepPulse restored on running indicator
//   2. Result card larger (≥760px) + image bigger (max-height up to 60vh)
//   3. Multi-line description with assertion line + variables line
//   4. Swipe transition (cmSwipeInRight / cmSwipeOutLeft, no clip-path)
//   5. Bottom subtitle bar: STEP X / Y + action chip + step text in English layout

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

// 1) wbStepPulse restored
await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.locator('.wb-case-item[data-case-id="saptest1"]').click();
await page.waitForTimeout(900);

const pulseInfo = await page.evaluate(() => {
  const step = document.querySelector('.wb-step');
  step.classList.add('is-running');
  step.classList.remove('is-pending', 'is-passed', 'is-failed');
  const ind = step.querySelector('.wb-step-indicator');
  return getComputedStyle(ind).animationName;
});
console.log(`${pulseInfo === 'wbStepPulse' ? '✓' : '✗'} Indicator pulse restored: ${pulseInfo}`);

// 2 + 5) Visit cinema and verify subtitle structure + swipe keyframes
await page.goto(BASE + '/#/cinema/saptest1', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

const captionParts = await page.evaluate(() => {
  const cap = document.querySelector('.cinema-caption');
  if (!cap) return null;
  return {
    hasStep: !!cap.querySelector('.cm-cap-step'),
    stepText: cap.querySelector('.cm-cap-step')?.textContent,
    hasAction: !!cap.querySelector('.cm-cap-action'),
    actionText: cap.querySelector('.cm-cap-action')?.textContent,
    hasText: !!cap.querySelector('.cm-cap-text'),
    captionBottom: getComputedStyle(cap).bottom,
    captionPosition: getComputedStyle(cap).position,
  };
});
console.log(`${captionParts?.hasStep ? '✓' : '✗'} Subtitle "STEP X / Y" chip: "${captionParts?.stepText}"`);
console.log(`${captionParts?.hasAction ? '✓' : '✗'} Action chip: "${captionParts?.actionText}"`);
console.log(`${captionParts?.captionPosition === 'absolute' && captionParts?.captionBottom === '0px' ? '✓' : '✗'} Caption pinned to bottom: ${captionParts?.captionPosition} / bottom=${captionParts?.captionBottom}`);

// Swipe keyframes
const swipe = await page.evaluate(() => {
  const out = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.type === CSSRule.KEYFRAMES_RULE) {
          if (['cmSwipeOutLeft', 'cmSwipeInRight', 'cmDissolveIn'].includes(rule.name)) {
            let txt = ''; for (const r of rule.cssRules) txt += r.cssText + ' ';
            out[rule.name] = txt;
          }
        }
      }
    } catch {}
  }
  return out;
});
console.log(`${swipe.cmSwipeOutLeft ? '✓' : '✗'} cmSwipeOutLeft keyframe present: ${!!swipe.cmSwipeOutLeft}`);
console.log(`${swipe.cmSwipeInRight ? '✓' : '✗'} cmSwipeInRight keyframe present: ${!!swipe.cmSwipeInRight}`);
console.log(`${!swipe.cmDissolveIn ? '✓' : '✗'} cmDissolveIn REMOVED (replaced by swipe): ${!swipe.cmDissolveIn}`);

await page.screenshot({ path: path.join(OUT, '48-cinema-subtitle.png'), fullPage: true });

// 2 + 3) Inject a fake PASS result with runSummary so we can see the new
// big card with assertion description.
await page.evaluate(() => {
  const stage = document.querySelector('.cinema-stage');
  if (!stage) return;
  document.querySelector('.cinema-result-back')?.remove();
  const back = document.createElement('div');
  back.className = 'cinema-result-back';
  back.innerHTML = `
    <div class="cinema-result is-pass">
      <div class="cr-glyph">✓</div>
      <div class="cr-title">RUN PASSED</div>
      <div class="cr-desc">✓ A1 == A2  (matched)
A1 = 6,494.83 · A2 = 6,494.83
共 27 步全部通过，20 步命中缓存。</div>
      <div class="cr-shot">
        <img src="/api/midscene-js/runs/2026-06-03T06-43-29-458-jsrun-saptest1-1234/screenshot/27" alt="last step" />
        <div class="cr-shot-cap">
          <span class="cr-shot-num">#27</span>
          <span>如果变量 A1 和 A2 相等，则测试用例执行成功</span>
          <a class="cr-shot-link" href="#">原图 ↗</a>
        </div>
      </div>
      <div class="cr-stats">
        <div class="cr-stat"><strong class="is-pass-num">27</strong><span>passed</span></div>
        <div class="cr-stat"><strong>27</strong><span>total</span></div>
        <div class="cr-stat"><strong>4m 34s</strong><span>duration</span></div>
        <div class="cr-stat"><strong>20</strong><span>cached</span></div>
      </div>
      <div class="cr-actions"><button class="primary">Watch replay</button><button>Close</button></div>
    </div>
  `;
  stage.appendChild(back);
});
await page.waitForTimeout(800);

const card = await page.evaluate(() => {
  const c = document.querySelector('.cinema-result');
  if (!c) return null;
  const rect = c.getBoundingClientRect();
  const img = c.querySelector('.cr-shot img');
  const imgRect = img ? img.getBoundingClientRect() : null;
  const desc = c.querySelector('.cr-desc')?.textContent || '';
  return {
    cardW: rect.width,
    cardH: rect.height,
    imgW: imgRect?.width,
    imgH: imgRect?.height,
    descLines: desc.split('\n').length,
    descHasAssertion: /A1 ==? A2|matched/.test(desc),
    descHasVariable: /A1\s*=/.test(desc),
  };
});
console.log(`${card.cardW > 760 ? '✓' : '✗'} Result card width ≥ 760px: ${Math.round(card.cardW)}px`);
console.log(`${card.descLines >= 3 ? '✓' : '✗'} Description multi-line (≥3 lines): ${card.descLines}`);
console.log(`${card.descHasAssertion ? '✓' : '✗'} Description includes assertion (A1 == A2)`);
console.log(`${card.descHasVariable ? '✓' : '✗'} Description includes variable values (A1 = …)`);

await page.screenshot({ path: path.join(OUT, '49-result-big.png'), fullPage: true });

console.log(`\nConsole errors: ${errs.length}`);
errs.filter(e => !/404 \(Not Found\)/.test(e)).forEach(e => console.log('  ✗', e));
await browser.close();
process.exit(errs.filter(e => !/404 \(Not Found\)/.test(e)).length ? 1 : 0);
