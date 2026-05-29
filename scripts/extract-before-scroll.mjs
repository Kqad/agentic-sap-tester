// Yank the "before-scroll" attachment(s) out of a Midscene report HTML and
// dump each one as a .jpg you can double-click open. Throwaway debug aid.
//
// usage: node scripts/extract-before-scroll.mjs [report-filename.html]
// If no arg, picks the most recent saptest1 jsrun report.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const REPORT_DIR = 'midscene_run/report';

let reportName = process.argv[2];
if (!reportName) {
  const candidates = readdirSync(REPORT_DIR)
    .filter((n) => /saptest1.*\.html$/.test(n))
    .map((n) => ({ n, t: readFileSync(join(REPORT_DIR, n), { encoding: 'utf8' }).length }));
  candidates.sort((a, b) => b.n.localeCompare(a.n));
  reportName = candidates[0]?.n;
  if (!reportName) { console.error('no saptest1 report found'); process.exit(1); }
}
const reportPath = resolve(REPORT_DIR, reportName);
console.log('Reading:', reportPath);

const html = readFileSync(reportPath, 'utf8');

// Two forms the screenshot can appear in:
//   1) "name":"before-scroll","url":"data:image/jpeg;base64,XXXX..."
//   2) "name":"before-scroll","data":"data:image/jpeg;base64,XXXX..."
// Match either, allow some whitespace, and pull base64 until the closing quote.
const re = /"name"\s*:\s*"before-scroll"[^{}]*?"(?:url|data)"\s*:\s*"data:image\/jpeg;base64,([^"]+)"/g;

let m;
let i = 0;
while ((m = re.exec(html)) !== null) {
  i++;
  const buf = Buffer.from(m[1], 'base64');
  const out = `before-scroll-${i}.jpg`;
  writeFileSync(out, buf);
  console.log(`  → ${out}  (${buf.length} bytes)`);
}
if (i === 0) {
  console.log('No "before-scroll" attachment found. Try grepping the HTML manually.');
  console.log('Sniff:', html.indexOf('before-scroll'));
}
