// Variable extraction + comparison for aiQuery / aiAssert steps.
// Ported from Desktop\saptest\src\lib\midscene.ts lines 816–942 + the
// aiQuery/aiAssert branches of executeApiGuideStep.
//
// Trigger:
//   - aiQuery instruction matches "记录为A1" / "保存为X" / "as A1"
//     → store query result under that name in the per-run variables Map.
//   - aiAssert instruction references two captured names
//     ("如果 A1 和 A2 相等", "A1 == A2") → compare locally
//     (numeric tolerance, fall back to normalized string equality),
//     push an AssertionRecord, throw if the comparison fails.

import { isMissingQueryResult } from './helpers.js';

// ── Variable name extraction (from aiQuery instructions). ───────────────
// Order matters — try the strongest, most specific patterns first. The
// killer was a regex like /(?:记录)\s*(?:为)?\s*([A-Za-z]\w*)/ where the
// "为" was optional: "记录Display document 页面..." captured "Display"
// instead of the A2 sitting at the end after "为A2". Now every match
// REQUIRES an explicit connector (为/as/作为/into/…) right before the
// name, OR anchors the match to end-of-string, so descriptions in the
// middle of the instruction can't accidentally win.
export function parseVariableName(instruction) {
  if (!instruction) return '';
  return (
    // "变量 X" anywhere — strongest signal, explicit "variable" keyword.
    instruction.match(/(?:保存|记录|记|存).*?变量\s*([A-Za-z][A-Za-z0-9_]*)/i)?.[1] ||
    instruction.match(/变量\s*([A-Za-z][A-Za-z0-9_]*)/i)?.[1] ||
    // "...为A2" / "...作为 A2" / "...成 A2" at the END of the instruction
    // (with or without space, with or without trailing punctuation).
    // This is the dominant user pattern: long description ending in 为<name>.
    instruction.match(/(?:为|作为|成)\s*([A-Z][A-Z0-9]{0,5})\s*[.。!！?？,，]?\s*$/)?.[1] ||
    // English "save/record/store as NAME" or trailing "as NAME".
    instruction.match(/\b(?:save|record|store|capture)\s+(?:as|to|into)\s+([A-Za-z][A-Za-z0-9_]*)\b/i)?.[1] ||
    instruction.match(/\bas\s+([A-Za-z][A-Za-z0-9_]*)\s*[.!?]?\s*$/i)?.[1] ||
    // Last-ditch: "记录" / "保存" followed IMMEDIATELY by a 1-6 char
    // ALL-CAPS-ish name (A1, A2, X, OUT) — short names look like
    // variables, not English description words.
    instruction.match(/(?:保存|记录|记|存)\s+([A-Z][A-Z0-9]{0,5})\b/)?.[1] ||
    // Unicode fallback (variables.js used to keep these for non-Latin
    // variable names like "甲" / "乙"). Kept for back-compat.
    instruction.match(/(?:保存|记录|记|存).*?变量\s*([\p{L}\p{N}_-]+)/u)?.[1] ||
    instruction.match(/变量\s*([\p{L}\p{N}_-]+)/u)?.[1] ||
    ''
  );
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Comparison-operator detection. ──────────────────────────────────────
export function detectComparisonOperator(instruction) {
  if (/(?:大于等于|不小于|>=)/.test(instruction)) return '>=';
  if (/(?:小于等于|不大于|<=)/.test(instruction)) return '<=';
  if (/(?:不相等|不等于|不同|不一致|!=|!==)/.test(instruction)) return '!=';
  if (/(?:大于|高于|超过|>)/.test(instruction)) return '>';
  if (/(?:小于|低于|少于|<)/.test(instruction)) return '<';
  return '==';
}

export function hasComparisonIntent(instruction) {
  return /(?:比较|对比|判断|校验|验证|断言|是否|相等|不相等|等于|不等于|一致|不同|大于|小于|高于|低于|超过|不少于|不小于|不大于|>=|<=|==|===|!=|!==|>|<)/.test(
    instruction,
  );
}

function findReferencedVariables(instruction, variables) {
  const out = [];
  for (const name of variables.keys()) {
    const re = new RegExp(
      `(^|[^\\p{L}\\p{N}_-])(${escapeRegExp(name)})(?=$|[^\\p{L}\\p{N}_-])`,
      'u',
    );
    const m = instruction.match(re);
    if (m) out.push({ name, index: m.index ?? 0 });
  }
  return out.sort((a, b) => a.index - b.index).map((x) => x.name);
}

// Returns { left, right, operator } or null if no comparison detected.
export function parseVariableComparison(instruction, variables) {
  const operator = detectComparisonOperator(instruction);
  const m =
    instruction.match(/(?:比较|对比).*?\b([A-Za-z][A-Za-z0-9_]*)\b\s*(?:和|与)\s*\b([A-Za-z][A-Za-z0-9_]*)\b/i) ||
    instruction.match(/\b([A-Za-z][A-Za-z0-9_]*)\b\s*(?:和|与)\s*\b([A-Za-z][A-Za-z0-9_]*)\b.*?(?:是否)?(?:相等|一致|相同|不相等|不同)/i) ||
    instruction.match(/\b([A-Za-z][A-Za-z0-9_]*)\b\s*(?:==|=|!=|!==|===)\s*\b([A-Za-z][A-Za-z0-9_]*)\b/i);
  if (m) return { left: m[1], right: m[2], operator };

  if (!hasComparisonIntent(instruction)) return null;

  const refs = findReferencedVariables(instruction, variables);
  if (refs.length < 2) return null;
  return { left: refs[0], right: refs[1], operator };
}

// ── Value normalization + comparison execution. ─────────────────────────
function normalizeComparableValue(value) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).replace(/\s+/g, '').trim();
  }
  return JSON.stringify(value ?? '').replace(/\s+/g, '').trim();
}

// Parses common locale variants: "1,234.56" (en) / "1.234,56" (de) / "1234,56".
function parseComparableNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const stripped = String(value ?? '').trim().replace(/\s+/g, '').replace(/[^\d,.-]/g, '');
  if (!stripped) return null;
  let txt = stripped;
  if (stripped.includes(',') && stripped.includes('.')) {
    txt = stripped.lastIndexOf(',') > stripped.lastIndexOf('.')
      ? stripped.replace(/\./g, '').replace(',', '.')
      : stripped.replace(/,/g, '');
  } else if (stripped.includes(',')) {
    txt = stripped.replace(',', '.');
  }
  const n = Number(txt);
  return Number.isFinite(n) ? n : null;
}

export function evaluateLocalComparison(left, right, operator) {
  const ln = parseComparableNumber(left);
  const rn = parseComparableNumber(right);
  if (ln !== null && rn !== null) {
    switch (operator) {
      case '!=': return ln !== rn;
      case '>':  return ln >  rn;
      case '<':  return ln <  rn;
      case '>=': return ln >= rn;
      case '<=': return ln <= rn;
      default:   return ln === rn;
    }
  }
  const equal = normalizeComparableValue(left) === normalizeComparableValue(right);
  if (operator === '!=') return !equal;
  if (operator !== '==') {
    throw new Error(`变量值不是数值，无法执行 ${operator} 比较。`);
  }
  return equal;
}

// ── Top-level helpers used by runner.js. ────────────────────────────────

// Called after a successful aiQuery. Returns the captured variable name (or
// '' if the instruction has no save-variable directive).
export function captureQueryVariable(instruction, result, variables, log) {
  const name = parseVariableName(instruction);
  if (!name) return '';
  variables.set(name, result);
  if (log) log(`Captured variable ${name} = ${truncForLog(result)}`);
  return name;
}

// Called for aiAssert steps BEFORE delegating to agent.aiAssert. If the
// instruction references already-captured variables, evaluate locally and
// push an AssertionRecord into summary.assertions. Returns:
//   { handled: true,  result: string }   → comparison done, skip agent.aiAssert
//   { handled: false }                   → no comparison, caller should
//                                          fall through to agent.aiAssert
// Throws on assertion failure (consistent with Midscene's aiAssert behavior).
export function tryLocalComparison(instruction, variables, summary) {
  const cmp = parseVariableComparison(instruction, variables);
  if (!cmp) return { handled: false };

  const lv = variables.get(cmp.left);
  const rv = variables.get(cmp.right);
  if (!variables.has(cmp.left) || !variables.has(cmp.right)) {
    throw new Error(
      `变量未记录，无法比较：${cmp.left}=${String(lv)}，${cmp.right}=${String(rv)}`,
    );
  }
  const lt = String(lv ?? '');
  const rt = String(rv ?? '');
  if (isMissingQueryResult(lt) || isMissingQueryResult(rt)) {
    throw new Error(
      `变量值缺失，无法比较：${cmp.left}=${lt}，${cmp.right}=${rt}`,
    );
  }
  const passed = evaluateLocalComparison(lv, rv, cmp.operator);
  const equal = evaluateLocalComparison(lv, rv, '==');
  summary.assertions.push({
    left: cmp.left, leftValue: lt,
    right: cmp.right, rightValue: rt,
    equal, operator: cmp.operator, passed,
  });
  const detail = `${cmp.left}=${lt} ${cmp.operator} ${cmp.right}=${rt}`;
  if (!passed) throw new Error(`Assertion failed: ${detail}`);
  return { handled: true, result: `Comparison: ${detail}` };
}

function truncForLog(v) {
  const s = typeof v === 'string' ? v : JSON.stringify(v ?? '');
  return s.length > 200 ? s.slice(0, 200) + '…' : s;
}
