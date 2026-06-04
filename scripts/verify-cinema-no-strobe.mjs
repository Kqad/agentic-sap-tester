// Verify the no-strobe fix: idle in the cinema page for 6 seconds (= 4 polls
// at 1500ms) and confirm the image element wasn't recreated each tick.
import { chromium } from 'playwright';

const TOKEN = process.env.SAPTEST_TOKEN;
const BASE = 'http://localhost:5174';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
await ctx.addCookies([{ name:'saptest_session', value: TOKEN, domain:'localhost', path:'/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();

await page.goto(BASE + '/#/cinema/saptest1', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Hook into image element creation to count
const stats = await page.evaluate(async () => {
  const frame = document.querySelector('.cinema-frame');
  if (!frame) return { error: 'no frame' };
  let creations = 0;
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && n.tagName === 'IMG') creations++;
      }
    }
  });
  obs.observe(frame, { childList: true });
  // Wait 6 seconds → ~4 poll ticks
  await new Promise(r => setTimeout(r, 6500));
  obs.disconnect();
  return { creations };
});

console.log(`Image element creations during 6s idle (≥4 polls): ${stats.creations}`);
console.log(`${stats.creations === 0 ? '✓' : '✗'} No strobing (expected: 0 new <img> on identical re-renders)`);

await browser.close();
process.exit(stats.creations === 0 ? 0 : 1);
