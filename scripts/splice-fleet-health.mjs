// Composite the rightmost ~330px of a fresh workbench screenshot (which
// contains the Fleet Health cell) onto parallel-three.png, covering the
// "Parallel run · 0/3 done" notification overlay. Both shots are taken at
// the same viewport (1900×950 @ 2× DPI = 3807×1900) so coordinates align
// pixel-for-pixel — no resizing needed.

import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';

const BASE = 'http://localhost:5174';
const TOKEN = process.env.SAPTEST_TOKEN;
const SRC  = path.resolve('SAP_pitch_6.3/deck/assets/parallel-three.png');
const TMP  = path.resolve('run-history/ui-verify/workbench-fresh-shot.png');
const OUT  = path.resolve('SAP_pitch_6.3/deck/assets/parallel-three-spliced.png');

// 1. Take a fresh workbench shot at the exact same viewport as parallel-three.
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1900, height: 950 },
  deviceScaleFactor: 2,
});
await ctx.addCookies([{ name:'saptest_session', value: TOKEN, domain:'localhost', path:'/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();
await page.goto(BASE + '/#/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await page.screenshot({ path: TMP, fullPage: false });

// Ask the page for the exact Fleet Health cell bounding box in CSS pixels.
const cellBox = await page.locator('.kpi-cell[data-kpi="health"]').boundingBox();
console.log('Fleet Health (CSS px):', cellBox);
await browser.close();

// 2. Detect the strip's right edge + Fleet Health cell width by inspecting
// the fresh shot at the resolution it shares with parallel-three.
const meta = await sharp(TMP).metadata();
console.log('Fresh shot:', meta.width, '×', meta.height);

// Convert the CSS bounding box (1× pixels) to image pixels (2× DPI). The
// notification overlay in parallel-three covers FLEET HEALTH and bleeds
// leftward past it. To paste a seamless replacement we slice from the
// AVG DURATION / TIME SAVED cell boundary all the way to the right edge.
// That gives us a clean cell border on the left of the splice (no torn
// values mid-cell). TIME SAVED's number value drifts to whatever the
// fresh workbench currently shows — close enough to be natural.
const DPR = 2;
const cellW = Math.round(cellBox.width * DPR);
// Start slice one full cell width LEFT of Fleet Health → covers
// TIME SAVED + FLEET HEALTH.
const padTop = 70;
const padBottom = 30;
const sliceX = Math.round(cellBox.x * DPR) - cellW;
const sliceY = Math.max(0, Math.round(cellBox.y * DPR) - padTop);
const sliceW = meta.width - sliceX;
const sliceH = Math.round(cellBox.height * DPR) + padTop + padBottom;

// 3. Extract the slice from the fresh shot (anchored to right edge).
const slice = await sharp(TMP)
  .extract({ left: sliceX, top: sliceY, width: sliceW, height: sliceH })
  .toBuffer();

// 4. Composite onto the source parallel-three.png. Anchor to the right
// edge: parallel-three is 3807 px wide vs fresh shot 3800, so the paste
// must be offset 7 px right of the slice's source X.
const srcMeta = await sharp(SRC).metadata();
const pasteX = srcMeta.width - sliceW;
await sharp(SRC)
  .composite([{ input: slice, left: pasteX, top: sliceY }])
  .toFile(OUT);

console.log(`✓ Spliced: ${OUT}`);
console.log(`  slice from fresh: x=${sliceX} y=${sliceY} w=${sliceW} h=${sliceH}`);
console.log(`  pasted onto src:  x=${pasteX} y=${sliceY}`);
