// Functional smoke test — replicates exactly what
// `GET /api/cases/_specs/:name/steps` would return (parser + params merge),
// without needing to authenticate against a running server.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSpecSteps } from './spec-steps.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const E2E = path.join(ROOT, 'e2e');
const CASES = path.join(E2E, 'cases');

function summarize(tree, params) {
  const out = [];
  for (const tc of tree.tests) {
    out.push(`  test('${tc.title}') @ line ${tc.line}`);
    for (const [i, step] of tc.steps.entries()) {
      const flags = [
        step.conditional ? 'COND' : null,
        step.loop ? 'LOOP' : null,
      ].filter(Boolean).join(' ');
      out.push(`    #${i + 1}  ${step.title}  [${step.actions.length} actions${flags ? ', ' + flags : ''}]`);
      for (const a of step.actions) {
        const tags = [
          a.conditional ? 'cond' : null,
          a.loop ? 'loop' : null,
          a.wrappedIn ? `retried("${a.wrapLabel}")` : null,
        ].filter(Boolean).join(' ');
        const txt = (a.text || (a.name ? `${a.name}(${a.args.join(', ')})` : '')).replace(/\s+/g, ' ').slice(0, 80);
        out.push(`        ${a.kind.padEnd(10)} ${txt}${tags ? '   <' + tags + '>' : ''}`);
      }
    }
  }
  return out.join('\n');
}

const specs = (await fs.readdir(E2E)).filter(n => n.endsWith('.spec.ts'));
for (const name of specs) {
  const full = path.join(E2E, name);
  const text = await fs.readFile(full, 'utf8');
  const tree = parseSpecSteps(`e2e/${name}`, text);

  const caseId = name.replace(/\.spec\.ts$/, '');
  let params = null;
  try {
    params = JSON.parse(await fs.readFile(path.join(CASES, `${caseId}.json`), 'utf8'));
  } catch { /* ignore */ }

  console.log('═'.repeat(60));
  console.log(`SPEC: e2e/${name}    params: ${params ? 'loaded' : 'none'}`);
  console.log('═'.repeat(60));
  console.log(summarize(tree, params));
  console.log('');
}
