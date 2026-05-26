// Generate e2e/cases/sap-stabilized-NN.json from the 8 frozen NL+JS files
// under "SAP TEST DEMO 5.21 1/SAP TEST DEMO 5.21/". The Web Console reads
// e2e/cases/*.json directly, so each generated file becomes one row in the
// "Test cases" table.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(
  ROOT,
  'SAP TEST DEMO 5.21 1',
  'SAP TEST DEMO 5.21',
);
const OUT_DIR = path.join(ROOT, 'e2e', 'cases');
const SAP_URL = 'https://mhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#';

// Per-case enrichments that aren't easy to derive from raw text.
// transactionCode -> shown as a chip in the UI summary column.
// favoritesEntry  -> shown as a second chip.
const META = {
  1: { tx: 'S_ALR_87011990', fav: 'Asset Balances', name: 'Asset History Sheet vs Asset Balances' },
  2: { tx: 'S_ALR_87012083', fav: null,             name: 'AP Reports & Analytics — Row 20/21 (export list)' },
  3: { tx: '/n/UI2/FLP',     fav: 'Aging Analysis', name: 'Manage AP Reports & Analytics — Row 19 (Fiori Aging Analysis)' },
  4: { tx: 'FBL1N',          fav: 'Manage Supplier Line Items', name: 'Supplier Balances — GUI FBL1N vs Fiori Manage Supplier Line Items' },
  5: { tx: 'S_ALR_87012284', fav: null,             name: 'CIT Statement — Row 8/9 (export list)' },
  6: { tx: 'FAGLL03H',       fav: null,             name: 'FI line item reports — additional fields (operational division)' },
  7: { tx: 'AS01',           fav: null,             name: 'AuC Asset Master Data Creation (Vendor Tool) — AS01/AS03' },
  8: { tx: 'FB03L',          fav: null,             name: 'FI line item reports — reference key columns (FB03L)' },
};

function parseTxt(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const [titleBlock, rest = ''] = raw.split(/\n\s*自然语言\s*[：:；;]/);
  const [nlBlock = '', jsBlock = ''] = rest.split(/\n\s*JS\s*[：:；;]/);
  return {
    titleLines: titleBlock.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
    naturalLanguage: nlBlock.trim(),
    jsSource: jsBlock.trim(),
  };
}

mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(SOURCE_DIR)
  .filter((f) => /^SAP test \d+ 自然语言\+JS\.txt$/.test(f))
  .map((f) => ({ f, n: Number(f.match(/SAP test (\d+)/)[1]) }))
  .sort((a, b) => a.n - b.n);

if (files.length !== 8) {
  console.error(`Expected 8 case files in ${SOURCE_DIR}, found ${files.length}`);
  process.exit(1);
}

const written = [];
for (const { f, n } of files) {
  const meta = META[n] ?? { tx: null, fav: null, name: `SAP test ${n}` };
  const { titleLines, naturalLanguage, jsSource } = parseTxt(path.join(SOURCE_DIR, f));
  const headline = titleLines.join(' — ');
  const id = `sap-stabilized-${String(n).padStart(2, '0')}`;
  const body = {
    $schema: `DEMO ${n} — ${headline}`,
    title: `DEMO ${n} · ${meta.name}`,
    source: `SAP TEST DEMO 5.21 1/SAP TEST DEMO 5.21/${f}`,
    sapUrl: SAP_URL,
    transactionCode: meta.tx,
    favoritesEntry: meta.fav,
    naturalLanguage,
    jsSource,
  };
  const outFile = path.join(OUT_DIR, `${id}.json`);
  writeFileSync(outFile, JSON.stringify(body, null, 2) + '\n', 'utf8');
  written.push({ id, file: path.relative(ROOT, outFile).replace(/\\/g, '/') });
}

console.log(`Wrote ${written.length} stabilized cases to e2e/cases/:`);
for (const w of written) console.log(` - ${w.id}  →  ${w.file}`);
