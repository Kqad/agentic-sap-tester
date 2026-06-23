// Generate JPG thumbnails for every slide in the pitch deck. Boots the
// deck via the file:// protocol, walks each slide via the deck's next-arrow,
// waits for any video to start, and captures a 1280×720 viewport screenshot
// cropped to the slide stage. Output → SAP_pitch_6.3/deck/assets/thumbs/NN.jpg.

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const DECK = path.resolve('SAP_pitch_6.3/deck/index.html');
const OUT = path.resolve('SAP_pitch_6.3/deck/assets/thumbs');
mkdirSync(OUT, { recursive: true });

const TOTAL = 22;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const url = 'file:///' + DECK.replace(/\\/g, '/');
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

for (let i = 1; i <= TOTAL; i++) {
  // Wait for slide reveals + any video to have a poster frame
  await page.waitForTimeout(900);
  // Hide the right thumb rail in the thumbnail itself so each thumb just
  // shows the slide content.
  await page.addStyleTag({ content: '.deck-rail { display: none !important; }' });
  const num = String(i).padStart(2, '0');
  await page.screenshot({
    path: path.join(OUT, `${num}.jpg`),
    quality: 80,
    type: 'jpeg',
    clip: { x: 0, y: 0, width: 1920, height: 1080 },
  });
  process.stdout.write(`✓ ${num} `);
  if (i < TOTAL) await page.click('#next');
}
console.log('\nDone.');
await browser.close();
