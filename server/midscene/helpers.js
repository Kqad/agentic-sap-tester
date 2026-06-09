// Small helpers shared by runner / recovery / variables / downloads.
// All ported 1:1 from Desktop\saptest\src\lib\midscene.ts (stripped of TS).

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export function normalizeError(err) {
  if (err instanceof Error) return err.message;
  return String(err ?? 'unknown error');
}

// Map step.midsceneApi (e.g. "agent.aiTap()", "aiTap") to the canonical short
// method name. Used for routing logic + step-delay tuning.
export function normalizeApiName(step) {
  const raw = String(step?.midsceneApi ?? '').toLowerCase();
  if (raw.includes('aiinput')) return 'aiInput';
  if (raw.includes('aitap')) return 'aiTap';
  if (raw.includes('aiscroll')) return 'aiScroll';
  if (raw.includes('aiquery')) return 'aiQuery';
  if (raw.includes('aiassert')) return 'aiAssert';
  if (raw.includes('aiboolean')) return 'aiBoolean';
  if (raw.includes('aihover')) return 'aiHover';
  if (raw.includes('aikeyboard')) return 'aiKeyboardPress';
  if (raw.includes('aiact')) return 'aiAct';
  return 'aiTap';
}

// "Element not found" style errors from Midscene / browser layers. Used by
// scroll-recovery to decide whether retrying after a scroll might help.
export function isElementNotFoundError(err) {
  const m = normalizeError(err).toLowerCase();
  return [
    'cannot find', "can't find", 'could not find', 'not found',
    'no element', 'no target', 'failed to locate', 'fail to locate',
    'unable to locate', 'locator',
    '找不到', '未找到', '无法找到', '无法定位',
  ].some((f) => m.includes(f));
}

// Transient connectivity errors that bypass recovery (a scroll won't fix a
// dead LLM endpoint, just bail).
export function isAiConnectionError(err) {
  const m = normalizeError(err).toLowerCase();
  const cause = err instanceof Error && err.cause instanceof Error
    ? `${err.cause.name}: ${err.cause.message}`.toLowerCase()
    : '';
  const detail = `${m}\n${cause}`;
  return ['connection error', 'fetch failed', 'und_err_socket', 'socketerror', 'other side closed', 'socket']
    .some((f) => detail.includes(f));
}

// aiQuery result classification — Midscene sometimes returns "not found"
// style strings rather than throwing. Treat as missing so recovery kicks in.
//
// `instruction` is optional. When supplied we also flag the "model hallucinated
// the variable name" case: an instruction like "查找...记录为A2" wants the
// data value, but a stuck model sometimes returns the literal "A2" (the
// variable name itself). Without this check the runner happily stores "A2" as
// the value, then the downstream aiAssert sees A1==A2 trivially because both
// are placeholder strings. Treat that as missing so recovery fires.
export function isMissingQueryResult(result, instruction) {
  if (result == null) return true;
  if (typeof result !== 'string') {
    if (typeof result === 'object') {
      const flat = JSON.stringify(result).toLowerCase();
      return flat === '{}' || flat === '[]' || flat.length < 3;
    }
    return false;
  }
  const n = result.trim().toLowerCase();
  if (!n) return true;
  const verbatimMiss = [
    'n/a', 'na', 'not found', 'not visible', 'missing', 'no data',
    'cannot find', 'could not find', 'unable to find', 'unable to locate',
    'cannot extract',
    '无法找到', '未找到', '没有找到', '找不到', '不存在',
    '无法读取', '无法提取', '无法获取',
  ].some((f) => n === f || n.includes(f));
  if (verbatimMiss) return true;
  if (instruction) {
    const varName =
      instruction.match(/(?:记录|保存|记|存)\s*(?:为|作为|成|到|进)?\s*([A-Za-z][A-Za-z0-9_]*)\b/i)?.[1] ||
      instruction.match(/\b(?:save|record|store)\s*(?:as|to|into)?\s*([A-Za-z][A-Za-z0-9_]*)\b/i)?.[1] ||
      '';
    if (varName && result.trim() === varName) return true;
  }
  return false;
}

export function canReplanApiGuideStep(step) {
  const api = normalizeApiName(step);
  // aiQuery is now eligible too — the replan layer does an aiAct with the
  // full case context (which can scroll / focus the right region) and then
  // re-runs the aiQuery to actually extract the data.
  return api === 'aiTap' || api === 'aiInput' || api === 'aiScroll' || api === 'aiQuery';
}

export function canUseScrollRecovery(step) {
  const api = normalizeApiName(step);
  return api === 'aiTap' || api === 'aiInput' || api === 'aiScroll' || api === 'aiQuery';
}

export function truncate(s, n) {
  if (s == null) return '';
  return s.length <= n ? s : `${s.slice(0, n)}…(${s.length - n} more)`;
}

export function safeStringify(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

// Step-execution timeouts / retry knobs.
// Bumped from 120s → 300s so the slower SAP screens (heavy reports, large
// drop-downs) and the model's own planning latency don't trip the outer
// timeout while the step is genuinely making progress.
export const STEP_TIMEOUT_MS = 600 * 1000;
// Scroll-extreme steps need extra headroom: aiAct drag (up to
// SCROLL_DRAG_TIMEOUT_MS) + aiBoolean verify (also up to SCROLL_DRAG_TIMEOUT_MS
// if the LLM is slow / hangs internally before erroring out). Without this,
// the outer recovery layer would time out while the inner work is still
// finishing — so the runner would "retry" a step that actually succeeded.
export const SCROLL_EXTREME_STEP_TIMEOUT_MS = 900 * 1000;
// Each step now gets exactly ONE attempt before falling into the recovery
// cascade. The previous 2-attempt loop ate ~10s + a second full step timeout
// before recovery kicked in; we now spend that budget on aiAct replan (which
// has full case context) and scroll recovery instead.
export const STEP_MAX_ATTEMPTS = 1;
export const STEP_RETRY_DELAY_MS = 10000;
export const SCROLL_DRAG_TIMEOUT_MS = 90 * 1000;
export const SCROLL_RECOVERY_DELAY_MS = 500;
export const RIGHT_SCROLL_RECOVERY_DELAY_MS = 5000;
export const SCROLL_RECOVERY_MAX_MOVES = 1;
export const SCROLL_RECOVERY_DIRECTIONS = ['right'];

// Inter-step delays. Defaults to STEP_DELAY_MS; if the step is an aiTap whose
// text mentions Execute (= SAP query submission), bump to EXECUTE_DELAY for
// the server round-trip. Before each aiQuery, sleep QUERY_PRE_DELAY so the
// freshly-rendered table has time to fully paint before we read cells.
export const STEP_DELAY_MS = 1000;
export const EXECUTE_DELAY_MS = 7000;
export const QUERY_PRE_DELAY_MS = 5000;

// Pick the right post-step delay based on the step's intent.
export function delayAfterStepMs(step) {
  const text = `${step?.title ?? ''} ${step?.naturalLanguageInstruction ?? ''}`.toLowerCase();
  if (normalizeApiName(step) === 'aiTap' && /execute/.test(text)) {
    return EXECUTE_DELAY_MS;
  }
  return STEP_DELAY_MS;
}

// Detect "scroll to extreme" intent ("滑/拖 + 最上/最下/最左/最右"). aiScroll
// steps that match get the verify-once path in runner.js: one drag, one LLM
// screenshot compare, then return regardless — never retry, never re-drag.
export function detectScrollExtreme(instruction) {
  if (!instruction || !/[滑拖滚拉]/.test(instruction)) return null;
  if (/(?:最|到)[下底]/.test(instruction)) return 'bottom';
  if (/(?:最|到)[上顶]/.test(instruction)) return 'top';
  if (/(?:最|到)右/.test(instruction)) return 'right';
  if (/(?:最|到)左/.test(instruction)) return 'left';
  return null;
}

export const FULL_PAGE_SCROLL_RECOVERY_STEPS = [
  {
    label: '滑动到底部',
    instruction:
      '页面右侧有一条纵向滚动条，滑块当前大概在屏幕右上角附近（因为页面停在顶部）。' +
      '按住这个滑块向下一路拖动到最底端，让原本在下方被裁掉的内容显示出来。' +
      '不要点击任何按钮或表格行，不要切换页面，不要拖动横向滚动条。',
    settleMs: SCROLL_RECOVERY_DELAY_MS,
  },
  {
    label: '滑动到最右边',
    instruction:
      '页面底部有一条横向滚动条，滑块当前大概在屏幕左下角附近（因为页面停在最左侧）。' +
      '按住这个滑块向右一路拖动到最右端，让原本在右侧被裁掉的内容显示出来。' +
      '不要点击任何按钮或表格行，不要切换页面，不要拖动纵向滚动条。',
    settleMs: RIGHT_SCROLL_RECOVERY_DELAY_MS,
  },
];
