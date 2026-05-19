import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const ROOT       = path.resolve(__dirname, '..');
export const E2E_DIR    = path.join(ROOT, 'e2e');
export const CASES_DIR  = path.join(E2E_DIR, 'cases');
export const REPORT_DIR = path.join(ROOT, 'midscene_run', 'report');
export const RESULTS_DIR = path.join(ROOT, 'test-results');
export const ENV_FILE   = path.join(ROOT, '.env');
export const PW_CONFIG  = path.join(ROOT, 'playwright.config.ts');
