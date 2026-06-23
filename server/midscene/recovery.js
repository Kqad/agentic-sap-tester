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
  delayAfterStepMs,
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

// After every recovery action (replan aiAct, full-page scroll aiAct,
// targeted scroll aiAct) we wait this long before re-attempting the
// original step. Gives the page time to settle (SAP transitions can
// trail by several seconds after an action returns).
const POST_RECOVERY_SETTLE_MS = 10_000;

// Before invoking the expensive/noisy aiAct recovery cascade, give SAP one
// short settle window and retry the original step. Many WebGUI transitions
// finish a few seconds after the previous action returns.
const PRE_REPLAN_RETRY_DELAY_MS = 5_000;


// Layer 2 pre-flight (cached xpath ↔ live DOM) polling window. SAP
// popups / modals can take 1-2 s to render after a preceding step's
// action — we poll briefly so we don't false-positive a miss on a
// still-rendering page, then declare miss if the xpath truly never
// resolves.
// Upper bound on polling. Loop exits the moment any cached xpath
// resolves (early-exit on `resolved = true`), so fast-hit steps only
// pay the cost of one `page.evaluate` (~ms). The 10 s ceiling exists
// only to handle slow SAP popup / modal renders before declaring miss.
const LAYER2_POLL_MS = 10_000;
const LAYER2_POLL_INTERVAL_MS = 200;

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
      // Unified 10s settle after every recovery action (overrides per-label
      // settleMs from FULL_PAGE_SCROLL_RECOVERY_STEPS).
      ctx.log(`Waiting ${POST_RECOVERY_SETTLE_MS}ms after 全页滑动 ${label}`);
      await sleep(POST_RECOVERY_SETTLE_MS);
      const result = await withTimeout(executeOne(agent, step, ctx), STEP_TIMEOUT_MS, `Step ${step.order}`);
      if (normalizeApiName(step) === 'aiQuery' && isMissingQueryResult(result, step?.naturalLanguageInstruction)) {
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
      // Down: small step — roughly 40% of the current viewport. Keeps
      // ~10% overlap between consecutive frames so context isn't lost,
      // and the loop can step up to SCROLL_RECOVERY_MAX_MOVES times
      // (~2.5 viewport heights total) before giving up. Each step is
      // small enough that we don't blast past the target row.
      : '在当前结果表格/页面区域使用鼠标滚轮向下滚动大约屏幕高度的 40%(保留上下文重叠,不要一次滚太多),让原本在下方被裁掉的数据行显示出来。不要点击表格内的按钮或行,不要拖动滚动条,不要切换页面。';
    for (let move = 1; move <= SCROLL_RECOVERY_MAX_MOVES; move += 1) {
      try {
        ctx.log(`Step ${step.order} scroll recovery aiAct ${direction} ${move}`);
        await withTimeout(
          agent.aiAct(recoveryInstruction),
          SCROLL_DRAG_TIMEOUT_MS,
          `Step ${step.order} scroll recovery ${direction}`,
        );
        // Unified 10s settle after every recovery action.
        ctx.log(`Waiting ${POST_RECOVERY_SETTLE_MS}ms after ${direction} scroll recovery`);
        await sleep(POST_RECOVERY_SETTLE_MS);
        const result = await withTimeout(executeOne(agent, step, ctx), STEP_TIMEOUT_MS, `Step ${step.order}`);
        if (normalizeApiName(step) === 'aiQuery' && isMissingQueryResult(result, step?.naturalLanguageInstruction)) {
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

// Extract locator prompts from a step's exampleCode. Cache YAML keys are
// the FIRST string argument to agent.aiTap / aiInput / aiScroll / aiHover /
// aiKeyboardPress. We match the literal opener (', ", or `) plus the body
// up to the matching closer. Returns [] if the step has no locator-based
// call (e.g. aiQuery without target, aiAssert, sleep) — those cannot
// pre-flight-miss because they don't consult the locator cache at all.
// Special case — "点击Execute" / "点击 Execute 按钮" steps. Per user
// observation, the SAP "Execute" button locator drifts often (many
// similar Execute buttons across screens), and Midscene's own LLM
// fallback (using just the step's NL) succeeds more reliably than our
// case-context-rich aiAct replan (which can over-think the context).
// On cache miss for these steps we let Midscene's natural cache-miss
// fallback run unmolested, then fall through to scroll recovery if
// that also fails.
function isExecuteStep(step) {
  const text = `${step?.naturalLanguageInstruction || ''} ${step?.title || ''}`.toLowerCase();
  // "execute" (English) — matches "Execute", "点击Execute", "Click Execute", etc.
  // Excludes "executable" / "execution" etc. by requiring a word boundary.
  return /\bexecute\b/i.test(text);
}

function extractStepLocatorPrompts(step) {
  const code = step?.exampleCode || '';
  if (!code) return [];
  const out = [];
  // aiTap / aiInput / aiHover: locator is the FIRST string arg. Their
  // locate result is what gets cached, so these prompts ARE the cache keys.
  const re1 = /agent\.ai(?:Tap|Input|Hover)\s*\(\s*(['"`])([\s\S]*?)\1/g;
  let m;
  while ((m = re1.exec(code)) !== null) out.push(m[2]);
  // aiKeyboardPress — two signatures, only ONE of them uses a locator:
  //   · 1-arg form `aiKeyboardPress("Enter")` — first arg is the KEY NAME,
  //     not a locator. Midscene dispatches the key to the currently-focused
  //     element with NO locate step → nothing to cache, nothing to
  //     pre-flight. Including it here was wrong: we'd look for "Enter" /
  //     "Tab" in the cache, miss (because they're never there), and abort
  //     the whole run via the "MISS → replan failed" branch.
  //   · 2-arg form `aiKeyboardPress("locator", { keyName: "Enter" })` —
  //     first arg IS a locator (focus this element first, then press key).
  //     That one DOES cache; check it only when we see the `, { keyName:`
  //     companion.
  const kbpRe = /agent\.aiKeyboardPress\s*\(\s*(['"`])([\s\S]*?)\1\s*,\s*\{\s*keyName\s*:/g;
  while ((m = kbpRe.exec(code)) !== null) out.push(m[2]);
  // aiScroll: locator is the SECOND arg (after the scroll-opts object), e.g.
  //   agent.aiScroll({ scrollType: 'untilBottom' }, "查询结果表格")
  const re2 = /agent\.aiScroll\s*\(\s*(?:\{[\s\S]*?\}|(['"`])[\s\S]*?\1)\s*,\s*(['"`])([\s\S]*?)\2/g;
  while ((m = re2.exec(code)) !== null) out.push(m[3]);
  return out;
}

// Pre-flight cache check. Single question:
//   For each of this step's locator prompts, do any of the recorded
//   xpaths resolve to an element on the live DOM right now?
//     · No (or no prompt entry exists, or no xpath under the entry) → MISS.
//     · Yes → HIT, run normally.
//
// We poll for ~2 s because some SAP popups / modals are still rendering
// at the moment we enter a new step (the previous step's inter-step
// delay isn't always enough). 2 s catches the typical render window
// without false-positiving on still-painting elements.
//
// Returns { miss: boolean, reason: string }.
async function stepCacheMissReason(step, ctx) {
  if (!ctx?.cachedXpaths) return { miss: false, reason: 'no cache index' };
  if (ctx.bypassStepOrders?.has?.(String(step.order))) return { miss: false, reason: 'force-replan step' };
  const prompts = extractStepLocatorPrompts(step);
  if (!prompts.length) return { miss: false, reason: 'no cached locator in this step' };
  if (!ctx.page) return { miss: false, reason: 'no page handle, skipping DOM check' };

  for (const prompt of prompts) {
    const xpaths = ctx.cachedXpaths.get(prompt) || [];
    if (xpaths.length === 0) {
      return { miss: true, reason: `no cached xpath for "${prompt}"` };
    }
    // Midscene's `|>>|` is a cross-iframe traversal token, not valid XPath —
    // document.evaluate parse-errors on it (swallowed) and always returns
    // false. The xpath is real and Midscene's own cache lookup can follow it
    // into the iframe; only our pre-flight can't. Skip pre-flight for this
    // prompt and let Midscene decide.
    if (xpaths.some((xp) => xp.includes('|>>|'))) {
      return { miss: false, reason: `cross-iframe locator for "${prompt}", deferring to Midscene cache` };
    }
    const deadline = Date.now() + LAYER2_POLL_MS;
    let resolved = false;
    let lastErr = null;
    while (Date.now() < deadline && !resolved) {
      for (const xp of xpaths) {
        try {
          const ok = await ctx.page.evaluate((xpath) => {
            try {
              return !!document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } catch { return false; }
          }, xp);
          if (ok) { resolved = true; break; }
        } catch (e) { lastErr = e; }
      }
      if (!resolved) await sleep(LAYER2_POLL_INTERVAL_MS);
    }
    if (!resolved) {
      if (lastErr) return { miss: false, reason: 'page evaluate threw, skipping pre-flight' };
      return { miss: true, reason: `cached xpath stale for "${prompt}" (polled ${LAYER2_POLL_MS}ms, ${xpaths.length} variant(s) unresolvable)` };
    }
  }
  return { miss: false, reason: 'all cached xpaths resolve on current DOM' };
}

// Extract the literal input value from aiInput exampleCode. Used to (a)
// surface the value next to the cache-key in case context, and (b) detect
// transaction-code-entry steps for the "回到主页 → 重输 t-code" rollback
// strategy.
function extractStepInputValue(step) {
  const m = /agent\.aiInput\s*\([^)]*?\{\s*value\s*:\s*(['"`])([\s\S]*?)\1/.exec(step?.exampleCode || '');
  return m ? m[2] : '';
}

// Detect "this aiInput step is entering a transaction code". T-codes look
// like FBL1N / VA01 / SE16N (all-caps + digits, 4-6 chars) or fast-paths
// like /n/UI2/FLP, /nVA01, /nSE38. Loose but precise enough to be useful —
// a false positive just gives the rollback model one extra step to consider.
function isTransactionCodeStep(step) {
  if (normalizeApiName(step) !== 'aiInput') return false;
  const v = extractStepInputValue(step).trim();
  if (!v) return false;
  if (/^\/[a-z]/i.test(v)) return true;                  // /n/UI2/FLP, /nVA01
  if (/^[A-Z][A-Z0-9_]{1,9}$/.test(v)) return true;      // FBL1N, VA01, SE16N
  return false;
}

// Build the full-case NL context for aiAct replan. The model sees every
// step's natural-language instruction verbatim, with the stuck step marked
// "← 当前卡在此步", plus the cache-key locator phrase and t-code entry
// flag for orientation — purely informational under the new flow (Stage 2
// goes home → runner replays from step 1, no AI-driven prior-step redo).
// A typical 27-step case is ~3–4 KB of text, far below the model's
// context budget and cheaper than the screenshot — so no truncation.
function buildCaseContext(step, ctx) {
  const steps = Array.isArray(ctx.caseSteps) ? ctx.caseSteps : null;
  if (!steps || !steps.length) return '';
  const lines = steps.map((s) => {
    const nl = (s.naturalLanguageInstruction || s.title || '').trim();
    const marker = s.order === step.order ? '  ← 当前卡在此步' : '';
    const [cacheKey] = extractStepLocatorPrompts(s);
    const inputValue = normalizeApiName(s) === 'aiInput' ? extractStepInputValue(s) : '';
    let cacheHint = '';
    if (cacheKey && inputValue) {
      cacheHint = `  [cache key: "${cacheKey}", value: "${inputValue}"]`;
    } else if (cacheKey) {
      cacheHint = `  [cache key: "${cacheKey}"]`;
    }
    const tcodeFlag = isTransactionCodeStep(s) ? '  🏠 事务码入口' : '';
    return `  第${s.order}步. ${nl}${cacheHint}${tcodeFlag}${marker}`;
  });
  const titleLine = ctx.caseTitle ? `测试用例：${ctx.caseTitle}\n\n` : '';
  return `${titleLine}完整流程：\n${lines.join('\n')}\n`;
}

// Shared base context: research framework + cache-key reuse hint + action
// vocabulary + hard constraints. Both stages prepend their stage-specific
// strategy section to this.
function buildBaseRecoveryGuidance(step, isQuery) {
  return [
    `第${step.order}步执行失败了，需要恢复。请先研判再动手。`,
    ``,
    `⚠ 关键变更:你的任务**不是直接执行第${step.order}步**,而是**把页面状态准备好,让 runner 用录制的 cache 再尝试一次**。`,
    `  · 你做完后,系统会自动等 10 秒,再用 cache 重新执行第${step.order}步。`,
    `  · 如果你直接执行了第${step.order}步,会和 cache 再执行的那一次产生重复(双击、重复输入)。`,
    ``,
    `研判思路：`,
    `  1. 把上方"完整流程"当作 ground truth —— case 作者已经写清楚正确路径是什么，不要凭你对 SAP 的通用经验另起炉灶猜其它入口。`,
    `  2. 流程里的步骤是连续依赖的：第${step.order}步能成功，前提是它前面的若干步骤已经把屏幕带到了正确位置。`,
    `  3. **不要默认前面的步骤都已经成功了**。光是"屏幕在某个页面" ≠ "前面所有步骤都执行成功"。要看具体证据,不能直接确认的就当作"它没执行",重做该步。宁可重做一次幂等动作,不要假定它成功了往下走。`,
    `  4. 对照当前屏幕：你现在的屏幕跟"第${step.order}步本该出现的屏幕"差多少？`,
    ``,
    `硬性约束：`,
    `  · **不要执行第${step.order}步本身** —— 让 cache 接管。`,
    `  · 不要执行第${step.order + 1}步或更后面的任何步骤。`,
    `  · 把页面调到第${step.order}步可以正确执行的状态后,立刻 <complete> 停。`,
    isQuery
      ? `  · 当前步是 aiQuery(读数据)。你只负责把目标值所在位置变成可见 / 可读状态,**不要自己念出值,也不要把值填回任何地方** —— 后续有独立的读取动作。`
      : null,
    ``,
    `多步操作规则:`,
    `  · 每个动作之间插一个 <action-type>Sleep</action-type>,duration 10000ms,让 SAP 屏幕过渡完成再做下一步。`,
    `  · SAP 的 dialog / 菜单展开 / 页面切换都可能需要几秒钟才稳定 —— 不插 Sleep 容易点错或定位不到下一个目标。`,
    `  · 所有准备动作都做完了,直接 <complete>,runner 会自动等 10 秒后用 cache 重试。`,
    ``,
    `🎯 优先复用 cache: 上方"完整流程"里每一步后面方括号里的 \`[cache key: "..."]\` 就是这步录制 cache 时用的定位字符串。`,
    `  · 如果你要重做某个先前步骤(回退场景),在 Tap / Input 的定位短语里**原封不动**用方括号里那个字符串,Midscene 就会直接 cache hit,跳过 LLM 重新定位 —— 又快又稳。`,
    `  · aiInput 步骤的方括号里同时给了 value,输入时也原样用那个 value。`,
    `  · 即便你自己描述该按钮的方式不同,也请改用方括号里的原文。`,
    `  · 步骤没有 \`[cache key: "..."]\` 提示(例如 sleep / aiQuery / aiAssert)的不适用此规则,正常处理。`,
    ``,
    `输出动作时使用 Midscene 标准 action 名:`,
    `  · 点击 → <action-type>Tap</action-type>`,
    `  · 输入文本 → <action-type>Input</action-type>`,
    `  · 滚动/拖拽 → <action-type>Scroll</action-type> / <action-type>Drag</action-type>`,
    `  · 悬停 → <action-type>Hover</action-type>`,
    `  · 键盘 → <action-type>KeyboardPress</action-type>`,
    `  · 等待 → <action-type>Sleep</action-type>`,
    `绝对不要输出 Click / 点击 / Press / Type 等其它写法 —— 那些 action-type Midscene 不认。`,
  ].filter(v => v !== null).join('\n');
}

// Stage 1 — minimal action. Only handle popups; if popup is the target,
// or there's no popup at all, do nothing and let runner probe the cache.
// The probe (executeOne after this aiAct) is the success signal: cache
// hit → done; cache miss → escalate to Stage 2.
function buildStage1Strategy(step) {
  return [
    `🎯 **本阶段目标:最小动作 —— 只处理 popup,然后立刻交回给 runner 试 cache。**`,
    `  这是 Stage 1。runner 会先让你做一遍尽量轻量的修复,试试是不是 popup 挡路这种小问题。`,
    `  如果 Stage 1 后 runner 用 cache 重试第${step.order}步**成功** → 任务完成,不会再叫你。`,
    `  如果 Stage 1 后 cache **还是 miss** → runner 会再叫你一次,那时候才走完整回退策略。`,
    `  所以本阶段**绝对不要做大动作**(不要回主页、不要重跑前面的步骤、不要 Esc 退多层),只做必要的 popup 处理。`,
    ``,
    `决策树:`,
    `  (a) 屏幕上有 popup,且 popup **就是第${step.order}步要操作的目标**(例如卡住步是"在弹出菜单里点 X / 在搜索结果列表里选第一项 / 在确认对话框里点 OK"):`,
    `      → **什么都不做**,直接 <complete>。让 runner 在当前 popup 上用 cache 命中目标。`,
    `  (b) 屏幕上有 popup,且 popup 跟第${step.order}步**无关**(系统提示、错误消息、authorization 报错、cookie 通知、session timeout 等):`,
    `      → 关掉它(X / Cancel / 确认 / 关闭 / Esc),Sleep 10000ms,然后 <complete>。`,
    `      → 不要做任何 popup 处理之外的动作。`,
    `  (c) 屏幕上**没有 popup**:`,
    `      → **什么都不做**,直接 <complete>。让 runner 试 cache。如果真是更深层的问题,Stage 2 才处理。`,
    ``,
    `不该在 Stage 1 做的事:`,
    `  · 回主页 / 点 SAP logo / 重输 t-code → 这是 Stage 2 的工作`,
    `  · 重做前面任何步骤 → Stage 2`,
    `  · 滚动找元素 → 等 Stage 2 或后续 scroll recovery`,
  ].join('\n');
}

// Stage 2 — go home (uniformly: click the top-left SAP logo). The AI does
// only this; afterwards the runner itself replays cached steps from
// step 1 through the step before the stuck one, then retries the stuck
// step. Keeping the AI's job to one stable action (point at a logo
// that's always in the same place) removes the chronic "model picks a
// different escape hatch each time" failure mode.
function buildStage2GoHomeStrategy(step) {
  return [
    `🎯 **本阶段目标:回 SAP 主页 —— 只做这一件事。**`,
    `  这是 Stage 2。Stage 1 (popup 处理 + cache 重试) 失败,说明屏幕状态偏离更深,需要重置到主页起点。`,
    ``,
    `🏠 **唯一操作:点击屏幕左上角的 SAP logo,把页面回到主页。**`,
    `  · 这是 SAP WebGUI 顶部工具栏最左侧的 "SAP" 品牌标识(始终在同一个位置)。`,
    `  · 如果屏幕上有 popup 挡住了 logo,先关 popup(X / Cancel / Esc),Sleep 10000ms,然后再点 logo。`,
    `  · 点 SAP logo 之后 Sleep 10000ms,等主页加载完成。`,
    `  · 不要 Esc 退多层、不要去找"返回主页"按钮、不要用别的路径 —— 统一就是点左上角 SAP logo。`,
    ``,
    `回到主页的标志:看到主菜单 / 顶部 SAP logo 加空的 t-code 输入框 / Fiori shell 启动页。`,
    `回到主页后 **立刻 <complete>**,**不要**自己重做后续准备步骤。`,
    ``,
    `🤖 你完成后,runner 会自动用 cache 重放:`,
    `  · 从**第1步**开始,一路重放到第${step.order - 1}步`,
    `  · 然后重试第${step.order}步`,
    `所以你的任务**只有**回主页这一步,不要替 runner 做后面的重放工作。`,
  ].join('\n');
}

// Stage 1 — popup-only replan. Build prompts → setAIActContext → aiAct
// (minimal action: close blocking popup or no-op) → settle → re-probe
// the stuck step via executeOne. Returns { recovered, result?, error? }.
async function runStage1Popup(agent, step, ctx, executeOne) {
  const stuckInstruction = (step.naturalLanguageInstruction || '').trim();
  const isQuery = normalizeApiName(step) === 'aiQuery';
  const context = buildCaseContext(step, ctx);
  const stageLabel = 'Stage 1 · 最小动作 (只处理 popup)';
  const longContext = [
    context,
    buildStage1Strategy(step),
    ``,
    buildBaseRecoveryGuidance(step, isQuery),
  ].join('\n');
  const stepCount = Array.isArray(ctx.caseSteps) ? ctx.caseSteps.length : 0;
  const shortTitle = [
    `🔁 ${stageLabel} · 第${step.order}步 · ${stuckInstruction}`,
    ``,
    `📋 已注入上下文:`,
    `  · 完整流程 (${stepCount} 步,标记当前卡住步 + 🏠 事务码入口)`,
    `  · Stage 1 策略: 只处理 popup,其它什么都不做`,
    `  · 硬性约束 (准备状态,不替 runner 做第${step.order}步)`,
    `  · 多步操作时,每步之间插 Sleep 10s 让屏幕过渡`,
    `  · action 词表 (Tap / Input / Scroll / Hover / KeyboardPress / Drag / Sleep)`,
    isQuery ? `  · aiQuery 专属约束 (只把目标值变成可见,不要自己读出)` : null,
    ``,
    `🎯 目标: 让第${step.order}步能正常 cache hit,runner 自动重试,你不直接执行`,
  ].filter(v => v !== null).join('\n');

  try {
    ctx.log(`Step ${step.order} ${stageLabel} via aiAct`);
    ctx.log(`Step ${step.order} replan summary:\n${shortTitle}`);
    // Suppress Midscene's "aiActContext is already set" console warning
    // when we re-set per replan call. Each replan needs a fresh per-step
    // context anyway, so the override IS intentional.
    const prevWarn = console.warn;
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('aiActContext is already set')) return;
      return prevWarn.apply(console, args);
    };
    try {
      await agent.setAIActContext(longContext);
    } finally {
      console.warn = prevWarn;
    }
    await withTimeout(
      agent.aiAct(shortTitle),
      STEP_TIMEOUT_MS,
      `Step ${step.order} ${stageLabel}`,
    );
    ctx.log(`Step ${step.order} ${stageLabel} aiAct completed — waiting ${POST_RECOVERY_SETTLE_MS}ms before cache retry`);
    await sleep(POST_RECOVERY_SETTLE_MS);

    try {
      const result = await withTimeout(executeOne(agent, step, ctx), STEP_TIMEOUT_MS, `Step ${step.order} ${stageLabel} retry`);
      if (isQuery && isMissingQueryResult(result, step?.naturalLanguageInstruction)) {
        ctx.log(`Step ${step.order} ${stageLabel} retry: aiQuery still missing: ${JSON.stringify(result)}`);
        return { recovered: false };
      }
      ctx.log(`Step ${step.order} ${stageLabel} retry succeeded via cache / normal path`);
      return { recovered: true, result };
    } catch (retryErr) {
      ctx.log(`Step ${step.order} ${stageLabel} retry failed: ${normalizeError(retryErr)}`);
      return { recovered: false, error: retryErr };
    }
  } catch (rep) {
    ctx.log(`Step ${step.order} ${stageLabel} aiAct failed: ${normalizeError(rep)}`);
    return { recovered: false, error: rep };
  }
}

// Stage 2 — AI clicks the top-left SAP logo to go home; runner then
// replays cached steps from step 1 through the step before the stuck
// one, then retries the stuck step. The AI's only job is "click the
// logo" — the replay is mechanical and driven by executeOne against the
// cache, so we get fast cache hits without re-prompting the model for
// each prep step.
async function runStage2HomeAndReplay(agent, step, ctx, executeOne) {
  const stageLabel = 'Stage 2 · 回主页 + cache 重放';
  const allSteps = Array.isArray(ctx.caseSteps) ? ctx.caseSteps : [];

  if (!allSteps.length || step.order <= 1) {
    ctx.log(`Step ${step.order} ${stageLabel}: nothing to replay (stuck step is the first step or case is empty) — skipping rollback`);
    return { recovered: false };
  }

  const stuckInstruction = (step.naturalLanguageInstruction || '').trim();
  const isQuery = normalizeApiName(step) === 'aiQuery';
  const context = buildCaseContext(step, ctx);
  const longContext = [
    context,
    buildStage2GoHomeStrategy(step),
    ``,
    buildBaseRecoveryGuidance(step, isQuery),
  ].join('\n');
  const stepCount = allSteps.length;
  const shortTitle = [
    `🏠 ${stageLabel} · 第${step.order}步 · ${stuckInstruction}`,
    ``,
    `📋 已注入上下文:`,
    `  · 完整流程 (${stepCount} 步,标记当前卡住步 + 🏠 事务码入口)`,
    `  · 唯一操作: 点击屏幕左上角 SAP logo 回主页`,
    `  · 回到主页后立即 <complete>,runner 会自动从第1步用 cache 重放到第${step.order - 1}步,再重试第${step.order}步`,
    ``,
    `🎯 目标: 把屏幕重置到主页,后续重放交给 runner`,
  ].join('\n');

  // AI: go home (click SAP logo, with popup-clear if needed).
  try {
    ctx.log(`Step ${step.order} ${stageLabel} via aiAct (click SAP logo)`);
    ctx.log(`Step ${step.order} replan summary:\n${shortTitle}`);
    const prevWarn = console.warn;
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('aiActContext is already set')) return;
      return prevWarn.apply(console, args);
    };
    try {
      await agent.setAIActContext(longContext);
    } finally {
      console.warn = prevWarn;
    }
    await withTimeout(
      agent.aiAct(shortTitle),
      STEP_TIMEOUT_MS,
      `Step ${step.order} ${stageLabel} go-home`,
    );
    ctx.log(`Step ${step.order} ${stageLabel} go-home completed — waiting ${POST_RECOVERY_SETTLE_MS}ms before cache replay`);
    await sleep(POST_RECOVERY_SETTLE_MS);
  } catch (e) {
    ctx.log(`Step ${step.order} ${stageLabel} go-home aiAct failed: ${normalizeError(e)}`);
    return { recovered: false, error: e };
  }

  // Reset Midscene's per-run cache gates before replay. Two of them:
  //
  //  1. `matchedCacheIndices` — Set of "this entry already used this run"
  //     keys. Without clearing, every prompt the main loop already
  //     consumed (steps 1 … latest-completed) would report "no unused
  //     cache found" and force a fresh ~30 s LLM relocate per replayed
  //     step.
  //
  //  2. `cacheOriginalLength` — matchCache's loop bound. Set ONCE at
  //     load from `cache.caches.length`. Any entry the main loop wrote
  //     via cache-miss + append (index ≥ original length) is INVISIBLE
  //     to matchCache forever, even after marker clear. We bump it to
  //     the current length so freshly-written entries become matchable
  //     for replay — otherwise the second visit to the same prompt
  //     guarantees another LLM call (and any LLM connection error then
  //     aborts the whole replay).
  //
  // Both stay best-effort: if Midscene's internals change shape we log
  // and continue (replay still works, just slower).
  try {
    const cache = agent?.taskCache;
    if (cache) {
      const beforeMarkers = cache.matchedCacheIndices?.size ?? 0;
      cache.matchedCacheIndices?.clear?.();
      const beforeLen = cache.cacheOriginalLength ?? 0;
      const liveLen = cache.cache?.caches?.length ?? beforeLen;
      if (liveLen > beforeLen) cache.cacheOriginalLength = liveLen;
      ctx.log(`Step ${step.order} ${stageLabel}: reset cache gates for replay — cleared ${beforeMarkers} used-marker(s)` +
        (liveLen > beforeLen ? `, bumped match-window ${beforeLen} → ${liveLen}` : ''));
    }
  } catch (e) {
    ctx.log(`Step ${step.order} ${stageLabel}: cache gate reset skipped (${e?.message ?? e})`);
  }

  // Runner: replay cached prep steps 1 … step.order-1.
  const prepSteps = allSteps.filter((s) => s.order < step.order);
  ctx.log(`Step ${step.order} ${stageLabel}: replaying ${prepSteps.length} step(s) via cache (第1步 → 第${step.order - 1}步)`);
  for (const prep of prepSteps) {
    const prepHead = `replay 第${prep.order}步 [${normalizeApiName(prep)}] ${(prep.title || prep.naturalLanguageInstruction || '').slice(0, 60)}`;
    try {
      ctx.log(`  ▸ ${prepHead}`);
      await withTimeout(executeOne(agent, prep, ctx), STEP_TIMEOUT_MS, prepHead);
      const wait = delayAfterStepMs(prep);
      if (wait) await sleep(wait);
    } catch (e) {
      ctx.log(`  ✗ ${prepHead} failed: ${normalizeError(e)} — aborting replay`);
      return { recovered: false, error: e };
    }
  }

  // Runner: retry the stuck step itself.
  try {
    ctx.log(`Step ${step.order} ${stageLabel}: retrying stuck step after cache replay`);
    const result = await withTimeout(executeOne(agent, step, ctx), STEP_TIMEOUT_MS, `Step ${step.order} ${stageLabel} retry`);
    if (isQuery && isMissingQueryResult(result, step?.naturalLanguageInstruction)) {
      ctx.log(`Step ${step.order} ${stageLabel} retry: aiQuery still missing: ${JSON.stringify(result)}`);
      return { recovered: false };
    }
    ctx.log(`Step ${step.order} ${stageLabel} retry succeeded after replay`);
    return { recovered: true, result };
  } catch (e) {
    ctx.log(`Step ${step.order} ${stageLabel} retry failed: ${normalizeError(e)}`);
    return { recovered: false, error: e };
  }
}

async function tryReplanWithCaseContext(agent, step, ctx, executeOne) {
  if (!canReplanApiGuideStep(step)) return { recovered: false };

  // Stage 1: minimal action — handle popup or no-op, then probe cache.
  const s1 = await runStage1Popup(agent, step, ctx, executeOne);
  if (s1.recovered) return s1;

  // Stage 2: AI clicks SAP logo → runner replays cached steps from the
  // latest 🏠 anchor through the stuck step.
  ctx.log(`Step ${step.order} Stage 1 did not recover — escalating to Stage 2 (回主页 + cache 重放)`);
  const s2 = await runStage2HomeAndReplay(agent, step, ctx, executeOne);
  if (s2.recovered) return s2;

  return { recovered: false, error: s2.error || s1.error };
}

async function retryOriginalStepBeforeReplan(agent, step, ctx, executeOne, stepTimeoutMs, reason) {
  ctx.log(`Step ${step.order} ${reason} — waiting ${PRE_REPLAN_RETRY_DELAY_MS}ms, then retrying original step before aiAct recovery`);
  await sleep(PRE_REPLAN_RETRY_DELAY_MS);
  try {
    const result = await withTimeout(executeOne(agent, step, ctx), stepTimeoutMs, `Step ${step.order} pre-replan retry`);
    if (normalizeApiName(step) === 'aiQuery' && isMissingQueryResult(result, step?.naturalLanguageInstruction)) {
      ctx.log(`Step ${step.order} pre-replan retry: aiQuery still missing: ${JSON.stringify(result)}`);
      return { recovered: false, error: new Error(`查询目标未找到：${JSON.stringify(result)}`), queryMissing: result };
    }
    ctx.log(`Step ${step.order} pre-replan retry succeeded; skipping aiAct recovery`);
    return { recovered: true, result };
  } catch (err) {
    ctx.log(`Step ${step.order} pre-replan retry failed: ${normalizeError(err)}`);
    return { recovered: false, error: err };
  }
}

// Orchestrator. Calls executeOne(agent, step, ctx). New cascade order:
//   1. one attempt at the recorded step
//   2. aiAct replan with full case context (was last; promoted because it
//      has more signal than blind scroll guesses)
//   3. full-page scroll recovery
//   4. targeted scroll recovery
//   5. throw lastError
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

  // Pre-flight cache check (two layers — prompt-not-cached + xpath-stale).
  // Either way Midscene would silently fall back to a context-less LLM call
  // and waste ~30-40s before throwing. Skip both and go straight to our
  // case-context-rich aiAct replan — EXCEPT for "Execute" steps, where
  // Midscene's own LLM fallback (no case context) tends to work better
  // (Execute button locator drifts a lot, our heavy replan over-thinks
  // the context).
  const isExec = isExecuteStep(step);
  const miss = isExec ? { miss: false, reason: 'execute step — bypassing pre-flight, letting Midscene LLM fallback handle it' } : await stepCacheMissReason(step, ctx);
  if (isExec) {
    ctx.log(`Step ${step.order} is an Execute step — skipping pre-flight, letting Midscene's own LLM fallback handle any cache miss`);
  }
  if (miss.miss) {
    ctx.log(`Step ${step.order} cache pre-flight MISS (${miss.reason}) — skipping cache attempt, going straight to replan`);
    const retry = await retryOriginalStepBeforeReplan(agent, step, ctx, executeOne, stepTimeoutMs, 'cache pre-flight miss');
    if (retry.recovered) return retry.result;
    if (retry.error) lastError = retry.error;
    if (typeof retry.queryMissing !== 'undefined') lastQueryMissing = retry.queryMissing;
    const r = await tryReplanWithCaseContext(agent, step, ctx, executeOne);
    if (r.recovered) return r.result;
    // Replan also failed — fall through to scroll recoveries so an
    // off-screen target still has a chance to be unstuck.
    lastError = r.error || new Error(`Step ${step.order} cache miss + replan failed`);
    if (isElementNotFoundError(lastError)) {
      const fp = await tryFullPageScrollRecovery(agent, step, ctx, executeOne);
      if (fp.recovered) return fp.result;
    }
    const sr = await tryScrollRecovery(agent, step, ctx, executeOne);
    if (sr.recovered) return sr.result;
    throw lastError;
  }

  // 1. One attempt at the recorded step.
  for (let attempt = 1; attempt <= STEP_MAX_ATTEMPTS; attempt += 1) {
    try {
      if (attempt > 1) ctx.log(`Step ${step.order} retry attempt ${attempt}/${STEP_MAX_ATTEMPTS}`);
      const result = await withTimeout(executeOne(agent, step, ctx), stepTimeoutMs, `Step ${step.order}`);
      if (normalizeApiName(step) === 'aiQuery' && isMissingQueryResult(result, step?.naturalLanguageInstruction)) {
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

  // 2. aiAct replan with full case context — moved ahead of scroll
  // recovery because the model sees the whole journey and the stuck
  // step's intent, so it can often fix locator misses (renamed buttons,
  // moved fields, hidden columns) without further scrolling. For aiQuery
  // the replan does an aiAct to make the target visible, then re-runs
  // the aiQuery so the data actually comes back.
  //
  // Execute steps skip this — Midscene's own LLM fallback already ran
  // (and failed) inside executeOne above. Going through our heavy replan
  // here would just re-ask the model with more context that, for Execute
  // buttons, tends to confuse rather than help. Fall straight to scroll.
  if (!isExec) {
    const retry = await retryOriginalStepBeforeReplan(agent, step, ctx, executeOne, stepTimeoutMs, 'failed initial attempt');
    if (retry.recovered) return retry.result;
    if (retry.error) lastError = retry.error;
    if (typeof retry.queryMissing !== 'undefined') lastQueryMissing = retry.queryMissing;

    const r = await tryReplanWithCaseContext(agent, step, ctx, executeOne);
    if (r.recovered) return r.result;
    if (r.error) lastError = r.error;
  } else {
    ctx.log(`Step ${step.order} (Execute) — skipping case-context replan, going to scroll recovery`);
  }

  // 3 + 4. Scroll recoveries — only useful when the issue is "target is
  // off-screen". Both guarded by elementNotFound / missingQuery signals.
  if (isElementNotFoundError(lastError)) {
    const r = await tryFullPageScrollRecovery(agent, step, ctx, executeOne);
    if (r.recovered) return r.result;
  }
  if (typeof lastQueryMissing !== 'undefined' || isElementNotFoundError(lastError)) {
    const r = await tryScrollRecovery(agent, step, ctx, executeOne);
    if (r.recovered) return r.result;
  }
  throw lastError instanceof Error ? lastError : new Error('API step execution failed.');
}
