// One-shot patch: my first version of server/midscene/runner.js wrote
//   report.url = "/midscene-report/<file>"
// but the static mount in server/index.js is /reports/. Walk run-history
// and rewrite the URL prefix.
//
// Safe to re-run: only touches records with the bad prefix.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = path.resolve(__dirname, '..', 'run-history');

let patched = 0;
let scanned = 0;
for (const name of readdirSync(RUNS_DIR)) {
  if (!name.endsWith('.json')) continue;
  scanned += 1;
  const file = path.join(RUNS_DIR, name);
  let body;
  try { body = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
  if (!body?.report?.url?.startsWith('/midscene-report/')) continue;
  body.report.url = body.report.url.replace('/midscene-report/', '/reports/');
  writeFileSync(file, JSON.stringify(body, null, 2), 'utf8');
  patched += 1;
  console.log(`patched ${name} → ${body.report.url}`);
}
console.log(`Scanned ${scanned} record(s); patched ${patched}.`);
