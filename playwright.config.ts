import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

// Headed Midscene flicker fix: deviceScaleFactor must match the host browser's
// window.devicePixelRatio (typically 1 / 1.25 / 1.5 / 2 on Windows depending on
// display scaling). Override via DEVICE_SCALE_FACTOR=<n> if your screen differs.
const deviceScaleFactor = Number(process.env.DEVICE_SCALE_FACTOR ?? 1.25);

export default defineConfig({
  testDir: './e2e',
  timeout: 180 * 1000,
  expect: { timeout: 30 * 1000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['@midscene/web/playwright-reporter', { type: 'merged' }],
    // Emits ##SAPEVT## … lines that the run server parses and forwards
    // to the web UI as live step status events.
    ['./server/run/reporter.cjs'],
  ],

  use: {
    headless: false,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor,
    actionTimeout: 30 * 1000,
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], deviceScaleFactor },
    },
  ],
});
