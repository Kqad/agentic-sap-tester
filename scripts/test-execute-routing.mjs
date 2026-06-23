// Trace which recovery path each step in saptest1 would take on cache miss.

import { readFileSync } from 'node:fs';

function isExecuteStep(step) {
  const text = `${step?.naturalLanguageInstruction || ''} ${step?.title || ''}`.toLowerCase();
  return /\bexecute\b/i.test(text);
}

const caseJson = JSON.parse(readFileSync('e2e/cases/saptest1.json', 'utf8'));
const steps = caseJson?.apiGuide?.steps || [];

console.log(`Case: ${caseJson.title || 'saptest1'}\n`);
console.log('Step routing on cache miss:\n');
for (const s of steps) {
  const exec = isExecuteStep(s);
  const path = exec
    ? '🔧 Midscene LLM → scroll (skip our replan)'
    : '🔁 Our context-rich replan';
  console.log(`  Step ${String(s.order).padStart(2, ' ')}: ${(s.naturalLanguageInstruction || s.title).slice(0, 50).padEnd(50, ' ')} → ${path}`);
}
