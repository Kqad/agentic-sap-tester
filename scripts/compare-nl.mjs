// Compare the natural language from the user's original .txt files vs the NL
// snapshot saved in Desktop SQLite (currently in the UUID-named case JSONs).
// If they're identical we can use either; if they differ we must decide
// which one to keep as canonical when consolidating to saptest1..saptest8.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CASES_DIR = path.join(ROOT, 'e2e', 'cases');

const sapTitleToN = new Map();
for (const name of readdirSync(CASES_DIR)) {
  if (!name.endsWith('.json')) continue;
  const body = JSON.parse(readFileSync(path.join(CASES_DIR, name), 'utf8'));
  const m = String(body.title ?? '').match(/^\s*SAP\s*TEST\s*(\d+)\s*$/i);
  if (!m) continue;
  sapTitleToN.set(name, { n: Number(m[1]), body });
}

const stabilizedToN = new Map();
for (const name of readdirSync(CASES_DIR)) {
  const m = name.match(/^sap-stabilized-(\d+)\.json$/);
  if (!m) continue;
  const body = JSON.parse(readFileSync(path.join(CASES_DIR, name), 'utf8'));
  stabilizedToN.set(Number(m[1]), { name, body });
}

function normalize(s) {
  return String(s ?? '').replace(/\r/g, '').trim();
}

for (let n = 1; n <= 8; n++) {
  const stab = stabilizedToN.get(n);
  const desktopEntry = [...sapTitleToN.values()].find((e) => e.n === n);
  if (!stab || !desktopEntry) {
    console.log(`\n=== SAP TEST ${n} === NOT FOUND (stab: ${!!stab}, desktop: ${!!desktopEntry})`);
    continue;
  }
  const txtNL = normalize(stab.body.naturalLanguage);
  const dtNL = normalize(desktopEntry.body.naturalLanguage);
  const same = txtNL === dtNL;
  console.log(`\n=== SAP TEST ${n} === ${same ? 'IDENTICAL ✓' : 'DIFFERENT ✗'}`);
  if (!same) {
    console.log('  --- .txt NL ---');
    console.log('    ' + txtNL.split('\n').map((l) => l.trim()).filter(Boolean).join('\n    '));
    console.log('  --- Desktop NL ---');
    console.log('    ' + dtNL.split('\n').map((l) => l.trim()).filter(Boolean).join('\n    '));
  }
}
