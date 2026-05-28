// Scroll-based recovery: when a step (especially aiQuery) fails with
// "element not found" / "missing result" we try to nudge the page in a
// few directions and re-execute the step. Ported from Desktop midscene.ts
// lines 1009–1125 + the orchestrator at 1597–1701.

import {
  sleep,
  withTimeout,
  normalizeError,
  normalizeApiName,
  isElementNotFoundError,
  isAiConnectionError,
  isMissingQueryResult,
  canUseScrollRecovery,
  canReplanApiGuideStep,
  detectScrollExtreme,
  STEP_TIMEOUT_MS,
  SCROLL_EXTREME_STEP_TIMEOUT_MS,
  STEP_MAX_ATTEMPTS,
  STEP_RETRY_DELAY_MS,
  SCROLL_DRAG_TIMEOUT_MS,
  SCROLL_RECOVERY_DELAY_MS,
  RIGHT_SCROLL_RECOVERY_DELAY_MS,
  SCROLL_RECOVERY_MAX_MOVES,
  SCROLL_RECOVERY_DIRECTIONS,
  FULL_PAGE_SCROLL_RECOVERY_STEPS,
} from './helpers.js';

// Page-level scroll attempts: tells the agent to drag the page to the
// bottom / right edge before retrying the step. Useful when the target
// element is below or to the right of the viewport.
export async function tryFullPageScrollRecovery(agent, step, ctx, executeOne) {
  if (!canUseScrollRecovery(step)) return { recovered: false };
  for (const { label, instruction, settleMs } of FULL_PAGE_SCROLL_RECOVERY_STEPS) {
    try {
      ctx.log(`Step ${step.order} 全页滑动恢复（aiAct）：${label}`);
      await withTimeout(
        agent.aiAct(instruction),
        SCROLL_DRAG_TIMEOUT_MS,
        `Step ${step.order} 全页滑动 ${label}`,
      );
      ctx.log(`Waiting ${settleMs}ms after 全页滑动 ${label}`);
      await sleep(settleMs);
      const result = await withTimeout(executeOne(agent, step, ctx), STEP_TIMEOUT_MS, `Step ${step.order}`);
      if (normalizeApiName(step) === 'aiQuery' && isMissingQueryResult(result)) {
        ctx.log(`Step ${step.order} 全页滑动 ${label} 后查询仍未命中`);
        continue;
      }
      ctx.log(`Step ${step.order} 全页滑动 ${label} 后恢复成功`);
      return { recovered: true, result };
    } catch (err) {
      ctx.log(`Step ${step.order} 全页滑动 ${label} 失败：${normalizeError(err)}`);
    }
  }
  return { recovered: false };
}

// Targeted recovery: click the table-scroll "rightmost" button (SAP-specific
// hint) or wheel-scroll the current container. One pass per direction.
export async function tryScrollRecovery(agent, step, ctx, executeOne) {
  if (!canUseScrollRecovery(step)) return { recovered: false };
  for (const direction of SCROLL_RECOVERY_DIRECTIONS) {
    const recoveryInstruction = direction === 'right'
      ? '结果表格左上角的工具栏里有一组横向导航按钮（类似 |< < > >| 的箭头图标，紧挨在 Menu 输入框右边），其中最右边那个指向竖线的「>|」按钮表示跳到最后一组列。请只点击一次这个「>|」按钮，让原本在右侧被裁掉的列显示出来。不要点击其它按钮，不要点击表格行，不要切换页面，不要拖动滚动条。'
      : '在当前结果表格区域使用鼠标滚轮向下快速滚动一次，让更多数据行显示出来。不要点击表格内的按钮或行，不要拖动滚动条，不要切换页面。';
    for (let move = 1; move <= SCROLL_RECOVERY_MAX_MOVES; move += 1) {
      try {
        ctx.log(`Step ${step.order} scroll recovery aiAct ${direction} ${move}`);
        await withTimeout(
          agent.aiAct(recoveryInstruction),
          SCROLL_DRAG_TIMEOUT_MS,
          `Step ${step.order} scroll recovery ${direction}`,
        );
        const delayMs = direction === 'right' ? RIGHT_SCROLL_RECOVERY_DELAY_MS : SCROLL_RECOVERY_DELAY_MS;
        ctx.log(`Waiting ${delayMs}ms after ${direction} scroll recovery`);
        await sleep(delayMs);
        const result = await withTimeout(executeOne(agent, step, ctx), STEP_TIMEOUT_MS, `Step ${step.order}`);
        if (normalizeApiName(step) === 'aiQuery' && isMissingQueryResult(result)) {
          ctx.log(`Step ${step.order} scroll recovery ${direction} ${move} still returned ${JSON.stringify(result)}`);
          continue;
        }
        ctx.log(`Step ${step.order} scroll recovery ${direction} ${move} completed`);
        return { recovered: true, result };
      } catch (err) {
        ctx.log(`Step ${step.order} scroll recovery ${direction} ${move} failed: ${normalizeError(err)}`);
        if (isAiConnectionError(err)) {
          ctx.log(`Step ${step.order} scroll recovery stopped after AI connection error`);
          return { recovered: false };
        }
      }
    }
  }
  return { recovered: false };
}

// Orchestrator. Calls executeOne(agent, step, ctx). On failure cascades
// through: retry × N → full-page scroll → targeted scroll → aiAct replan.
// `executeOne` is the runner's per-step dispatcher (defined in runner.js).
export async function executeStepWithRecovery(agent, step, ctx, executeOne) {
  let lastError = null;
  let lastQueryMissing;

  // Scroll-extreme dispatcher in runner.js does its own internal verify
  // loop (aiAct drag up to SCROLL_DRAG_TIMEOUT_MS + aiBoolean verify up to
  // SCROLL_DRAG_TIMEOUT_MS). Give it the headroom — otherwise the outer
  // 120s ceiling fires while the inner work is still completing, causing
  // the runner to "retry" a step that actually already succeeded.
  const isScrollExtreme = normalizeApiName(step) === 'aiScroll'
    && detectScrollExtreme(step.naturalLanguageInstruction ?? '');
  const stepTimeoutMs = isScrollExtreme ? SCROLL_EXTREME_STEP_TIMEOUT_MS : STEP_TIMEOUT_MS;

  for (let attempt = 1; attempt <= STEP_MAX_ATTEMPTS; attempt += 1) {
    try {
      if (attempt > 1) ctx.log(`Step ${step.order} retry attempt ${attempt}/${STEP_MAX_ATTEMPTS}`);
      const result = await withTimeout(executeOne(agent, step, ctx), stepTimeoutMs, `Step ${step.order}`);
      if (normalizeApiName(step) === 'aiQuery' && isMissingQueryResult(result)) {
        ctx.log(`Step ${step.order} query target not found: ${JSON.stringify(result)}`);
        lastError = new Error(`查询目标未找到：${JSON.stringify(result)}`);
        lastQueryMissing = result;
        if (attempt < STEP_MAX_ATTEMPTS) {
          ctx.log(`Waiting ${STEP_RETRY_DELAY_MS}ms before retrying step ${step.order}`);
          await sleep(STEP_RETRY_DELAY_MS);
        }
        continue;
      }
      return result;
    } catch (err) {
      lastError = err;
      ctx.log(`Step ${step.order} attempt ${attempt} failed: ${normalizeError(err)}`);
      if (isAiConnectionError(err)) {
        ctx.log(`Step ${step.order} bailing out (AI connection error)`);
        throw err;
      }
      if (attempt < STEP_MAX_ATTEMPTS) {
        ctx.log(`Waiting ${STEP_RETRY_DELAY_MS}ms before retrying step ${step.order}`);
        await sleep(STEP_RETRY_DELAY_MS);
      }
    }
  }

  if (isElementNotFoundError(lastError)) {
    const r = await tryFullPageScrollRecovery(agent, step, ctx, executeOne);
    if (r.recovered) return r.result;
  }
  if (typeof lastQueryMissing !== 'undefined' || isElementNotFoundError(lastError)) {
    const r = await tryScrollRecovery(agent, step, ctx, executeOne);
    if (r.recovered) return r.result;
  }
  if (canReplanApiGuideStep(step)) {
    try {
      ctx.log(`Step ${step.order} fallback replan via aiAct`);
      await withTimeout(
        agent.aiAct(`Recover and complete this UI action only: ${step.naturalLanguageInstruction}`),
        STEP_TIMEOUT_MS,
        `Step ${step.order} replan`,
      );
      ctx.log(`Step ${step.order} fallback replan completed`);
      return undefined;
    } catch (rep) {
      ctx.log(`Step ${step.order} fallback replan failed: ${normalizeError(rep)}`);
      throw rep;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('API step execution failed.');
}
