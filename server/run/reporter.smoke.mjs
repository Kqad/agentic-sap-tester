// Reporter smoke test — instantiates the reporter and feeds it mock
// objects shaped like what Playwright passes, then checks the stdout.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Reporter = require('./reporter.cjs');

// Capture process.stdout writes so we can inspect what the reporter emitted.
const captured = [];
const origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...rest) => {
  captured.push(String(chunk));
  return origWrite(chunk, ...rest);
};

const r = new Reporter();
r.onBegin({}, {});
r.onTestBegin({ title: 'demo test', location: { file: 'x', line: 1 } });
r.onStepBegin({}, {}, { category: 'test.step', title: 'Step 1: prep', location: { line: 10 }, parent: null });
r.onStepEnd  ({}, {}, { category: 'test.step', title: 'Step 1: prep', location: { line: 10 }, parent: null, duration: 123 });
r.onStepBegin({}, {}, { category: 'test.step', title: 'Step 2: fail', location: { line: 20 }, parent: null });
r.onStepEnd  ({}, {}, { category: 'test.step', title: 'Step 2: fail', location: { line: 20 }, parent: null, duration: 456, error: { message: 'boom' } });
// Non-test.step categories must be filtered out.
r.onStepBegin({}, {}, { category: 'pw:api', title: 'page.click', location: { line: 99 }, parent: null });
r.onTestEnd({ title: 'demo test' }, { status: 'failed', duration: 1500, error: { message: 'fail' } });
r.onEnd({ status: 'failed' });

process.stdout.write = origWrite;

const lines = captured.join('').split('\n').filter(Boolean);
const eventLines = lines.filter(l => l.startsWith('##SAPEVT## '));
const parsed = eventLines.map(l => JSON.parse(l.slice('##SAPEVT## '.length)));

console.error('');
console.error('--- summary ---');
console.error(`captured ${lines.length} total lines, ${eventLines.length} event lines`);
const types = parsed.map(p => `${p.type}/${p.phase ?? ''}${p.line ? '@' + p.line : ''}${p.status ? '(' + p.status + ')' : ''}`);
console.error('events:', types.join(', '));

// Assertions
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exit(1); } };
// Expected 8 events: session.begin, test.begin, step1.begin, step1.end,
// step2.begin, step2.end, test.end, session.end. The pw:api step is filtered.
assert(parsed.length === 8, `expected 8 events, got ${parsed.length}`);
assert(parsed[0].type === 'session' && parsed[0].phase === 'begin', 'first should be session begin');
assert(parsed[1].type === 'test' && parsed[1].phase === 'begin', 'second should be test begin');
assert(parsed[2].type === 'step' && parsed[2].phase === 'begin' && parsed[2].line === 10, 'step 1 begin @ line 10');
assert(parsed[3].type === 'step' && parsed[3].phase === 'end' && parsed[3].status === 'passed' && parsed[3].durationMs === 123, 'step 1 end passed 123ms');
assert(parsed[4].type === 'step' && parsed[4].phase === 'begin' && parsed[4].line === 20, 'step 2 begin @ line 20');
assert(parsed[5].type === 'step' && parsed[5].phase === 'end' && parsed[5].status === 'failed' && parsed[5].errorMessage === 'boom', 'step 2 end failed');
assert(parsed.findIndex(p => p.line === 99) === -1, 'pw:api step must be filtered out');
assert(parsed[6].type === 'test' && parsed[6].phase === 'end' && parsed[6].status === 'failed', 'test end failed');
assert(parsed[7].type === 'session' && parsed[7].phase === 'end', 'last should be session end');
console.error('ALL ASSERTIONS PASSED');
