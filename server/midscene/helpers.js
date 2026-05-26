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
export function isMissingQueryResult(result) {
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
  return [
    'n/a', 'na', 'not found', 'not visible', 'missing', 'no data',
    'cannot find', 'could not find', 'unable to find', 'unable to locate',
    'cannot extract',
    '无法找到', '未找到', '没有找到', '找不到', '不存在',
    '无法读取', '无法提取', '无法获取',
  ].some((f) => n === f || n.includes(f));
}

export function canReplanApiGuideStep(step) {
  const api = normalizeApiName(step);
  return api === 'aiTap' || api === 'aiInput' || api === 'aiScroll';
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

// Step-execution timeouts / retry knobs (copied from Desktop).
export const STEP_TIMEOUT_MS = 120 * 1000;
export const STEP_MAX_ATTEMPTS = 2;
export const STEP_RETRY_DELAY_MS = 3000;
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

export const FULL_PAGE_SCROLL_RECOVERY_STEPS = [
  {
    label: '滑动到底部',
    instruction:
      '将整个网页向下滚动到最底部，让原本在下方被裁掉的内容显示出来。' +
      '不要点击任何按钮或表格行，不要切换页面，不要拖动横向滚动条。',
    settleMs: SCROLL_RECOVERY_DELAY_MS,
  },
  {
    label: '滑动到最右边',
    instruction:
      '将整个网页向右横向滚动到最右边，让原本在右侧被裁掉的内容显示出来。' +
      '不要点击任何按钮或表格行，不要切换页面，不要拖动纵向滚动条。',
    settleMs: RIGHT_SCROLL_RECOVERY_DELAY_MS,
  },
];
