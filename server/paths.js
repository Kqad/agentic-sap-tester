import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const ROOT       = path.resolve(__dirname, '..');
export const E2E_DIR    = path.join(ROOT, 'e2e');
export const CASES_DIR  = path.join(E2E_DIR, 'cases');
export const REPORT_DIR = path.join(ROOT, 'midscene_run', 'report');
// Per-run step screenshots written by the runner after each apiGuide step.
// Layout: midscene_run/screenshots/<runId>/step-<order>.jpg
export const SCREENSHOTS_DIR = path.join(ROOT, 'midscene_run', 'screenshots');
export const RESULTS_DIR = path.join(ROOT, 'test-results');
// History records live OUTSIDE test-results/ because Playwright wipes its
// outputDir (= test-results) at the start of every run.
export const RUNS_DIR    = path.join(ROOT, 'run-history');
export const ENV_FILE   = path.join(ROOT, '.env');
export const PW_CONFIG  = path.join(ROOT, 'playwright.config.ts');
