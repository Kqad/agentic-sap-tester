// Generate a Midscene apiGuide from natural language via an OpenAI-compatible
// chat completion. Trimmed-down port of Desktop\saptest\src\lib\llm.ts:
//
//   * One-shot prompt instead of stepwise 40-iteration loop (cheaper, faster,
//     slightly lower quality for very long cases).
//   * Heuristic apiName inference + step normalization (copied 1:1).
//   * No doc retrieval from llms-full.txt yet (skip the 446KB Midscene docs
//     load — can be added later if the LLM produces too-generic results).
//   * Robust JSON parse from LLM output (handles ```json fences, prose leak).
//   * Local fallback that splits NL by line + applies heuristics, used when
//     the LLM call fails or the env isn't configured.

import { configureLlmProxy } from './llm-proxy.js';

// ── ENV-driven config ─────────────────────────────────────────────────
export function getYamlConverterConfig() {
  const apiKey = process.env.YAML_LLM_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.YAML_LLM_MODEL || process.env.OPENAI_MODEL;
  const baseUrl = (
    process.env.YAML_LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    'https://api.openai.com/v1'
  ).replace(/\/$/, '');
  if (!apiKey || !model) {
    throw new Error(
      'API guide LLM not configured. Set YAML_LLM_API_KEY/YAML_LLM_MODEL ' +
        '(or OPENAI_API_KEY/OPENAI_MODEL) in .env.',
    );
  }
  return { apiKey, model, baseUrl };
}

// ── Top-level entry: returns a fully normalized MidsceneApiGuide. ─────
// Default path is local rules (NL line-split + keyword heuristics). The LLM
// path is opt-in via API_GUIDE_USE_LLM=1 in .env, because for SAP test cases
// the deterministic local rules give more consistent step structure than the
// LLM (which sometimes rewrites/merges/drops steps). When LLM is enabled and
// fails or isn't configured, we fall through to the same local rules.
export async function generateMidsceneApiGuide(input) {
  if (!input?.naturalLanguage?.trim()) {
    throw new Error('naturalLanguage is required.');
  }

  const useLlm = process.env.API_GUIDE_USE_LLM === '1';
  if (!useLlm) {
    return buildFallbackApiGuide(input, '', [], { localOnly: true });
  }

  let config;
  try {
    config = getYamlConverterConfig();
  } catch (e) {
    // LLM opted-in but not configured → fall through to local rules.
    return buildFallbackApiGuide(input, e.message, [], { localOnly: true });
  }

  configureLlmProxy();
  try {
    const rawContent = await callChatCompletion(
      config,
      [
        {
          role: 'system',
          content:
            'You are a Midscene.js API step planner. Output ONLY valid JSON ' +
            'matching the requested schema. No Markdown, no explanation.',
        },
        { role: 'user', content: buildOneShotApiGuidePrompt(input) },
      ],
      { temperature: 0.1, timeoutMs: 90_000, attempts: 1 },
    );
    return validateApiGuide(rawContent, input);
  } catch (err) {
    return buildFallbackApiGuide(input, modelErrorMessage(err));
  }
}

// ── HTTP layer ────────────────────────────────────────────────────────
async function callChatCompletion(config, messages, { temperature = 0.1, timeoutMs = 60_000, attempts = 1 } = {}) {
  const url = `${config.baseUrl}/chat/completions`;
  let lastErr = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          temperature,
          response_format: { type: 'json_object' },
          messages,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 400)}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('LLM returned empty content.');
      }
      return content;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt >= attempts) throw err;
    }
  }
  throw lastErr ?? new Error('LLM call failed.');
}

export function modelErrorMessage(err) {
  if (!(err instanceof Error)) return 'unknown error';
  if (err.name === 'AbortError') return 'LLM request timed out.';
  if (err.cause instanceof Error) return `${err.message} (${err.cause.message})`;
  return err.message;
}

// ── Prompt construction ───────────────────────────────────────────────
function buildOneShotApiGuidePrompt(input) {
  return [
    '请把下面的自然语言自动化需求转换成 Midscene.js API 步骤指南。',
    '输出必须是合法 JSON,不要包含 Markdown 代码块,也不要输出解释性前后缀。',
    '',
    'JSON 结构必须严格包含这些字段:',
    '{',
    '  "summary": "一句话总结要自动化的目标",',
    '  "assumptions": ["必要前提或上下文假设"],',
    '  "steps": [',
    '    {',
    '      "order": 1,',
    '      "title": "步骤标题",',
    '      "midsceneApi": "agent.aiTap() | agent.aiInput() | agent.aiScroll() | agent.aiQuery() | agent.aiAssert() | agent.aiBoolean()",',
    '      "naturalLanguageInstruction": "传给该 API 的自然语言指令",',
    '      "reason": "为什么这一步使用这个 API",',
    '      "exampleCode": "一行 TypeScript 示例代码"',
    '    }',
    '  ],',
    '  "recommendedYamlSnippet": "等价或近似的 Midscene YAML 片段",',
    '  "docReferences": [],',
    '  "warnings": ["风险、易错点或需要用户补充的信息"]',
    '}',
    '',
    '规划规则:',
    '1. 必须按真实 UI 操作粒度拆分步骤,不允许把原始编号段落整体塞进一个 API。',
    '2. 每一次点击菜单/按钮/链接、每一次输入字段、每一次勾选复选框、每一次执行查询、每一次提取表格值、每一次比较断言,都必须是独立 steps 项。',
    '3. 一句话里同时包含多个字段输入(如 company code 8540, Asset number 1010001732, Report date 30.04.2026),必须拆成多个 aiInput 步骤。',
    '4. SAP 场景要明确目标位置:TC/OK Code 框、company code 字段、Asset number 字段、Report date 字段、List assets 复选框、右下角 Execute 按钮、指定表格列。',
    '5. 提取变量用 agent.aiQuery();比较 A1/A2 是否相等用 agent.aiAssert()。',
    '6. midsceneApi 每步只能写一个明确 API,禁止 agent.aiTap() / agent.aiInput() 这种斜杠组合。',
    '7. 禁用 agent.aiAct() 和 agent.ai():任何步骤都不能返回 aiAct 或 ai。',
    '8. 点击目标优先 agent.aiTap();输入字段优先 agent.aiInput()。',
    '9. "启用/开启/勾选某设置并保存" 必须拆成进入菜单、打开设置项、切到目标页、勾选/启用控件、点击 Save 多个步骤。',
    '10. TC/搜索框里搜索 transaction code 用 agent.aiInput(),不是 agent.aiTap();如 "TC框搜索 S_ALR_87011990" 必须是 agent.aiInput()。',
    '11. 每一步都要给出可直接放进代码的 exampleCode。',
    '12. 断言必须具体、可观察。',
    '13. 缺少账号/密码/目标页面等必要信息,放到 warnings 或 assumptions。',
    '',
    `标题: ${input.title || '未命名需求'}`,
    `描述: ${input.description || '无'}`,
    `targetUrl: ${input.targetUrl || '未提供'}`,
    '自然语言需求:',
    input.naturalLanguage,
  ].join('\n');
}

// ── Response parsing + step normalization ─────────────────────────────
function stripCodeFence(content) {
  return content
    .replace(/^```yaml\s*/i, '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
}

function validateApiGuide(rawContent, input) {
  const stripped = stripCodeFence(rawContent);
  const jsonStart = stripped.indexOf('{');
  const jsonEnd = stripped.lastIndexOf('}');
  const jsonContent =
    jsonStart >= 0 && jsonEnd > jsonStart ? stripped.slice(jsonStart, jsonEnd + 1) : stripped;
  let parsed;
  try { parsed = JSON.parse(jsonContent); }
  catch (e) { throw new Error('LLM did not return parseable JSON: ' + e.message); }

  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];
  if (rawSteps.length === 0) throw new Error('LLM response has no steps.');

  const steps = rawSteps.map((item, index) => {
    const rec = item && typeof item === 'object' ? item : {};
    const instruction = typeof rec.naturalLanguageInstruction === 'string'
      ? rec.naturalLanguageInstruction.trim()
      : '';
    const rawApi = typeof rec.midsceneApi === 'string' ? rec.midsceneApi : 'agent.aiTap()';
    const inferredApi = inferMidsceneApi(instruction);
    const midsceneApi =
      rawApi.toLowerCase().includes('aiact') || rawApi.toLowerCase() === 'agent.ai()'
        ? inferredApi
        : rawApi;
    const xpath = typeof rec.xpath === 'string' && rec.xpath.trim() ? rec.xpath.trim() : undefined;
    return {
      order: typeof rec.order === 'number' ? rec.order : index + 1,
      title:
        typeof rec.title === 'string' && rec.title.trim()
          ? rec.title.trim()
          : instruction.length > 28 ? instruction.slice(0, 28) + '...' : instruction,
      midsceneApi,
      naturalLanguageInstruction: instruction,
      xpath,
      reason:
        typeof rec.reason === 'string' && rec.reason.trim()
          ? rec.reason
          : reasonForApi(midsceneApi, instruction),
      exampleCode:
        typeof rec.exampleCode === 'string' && rec.exampleCode.trim()
          ? rec.exampleCode
          : exampleCodeForApi(midsceneApi, instruction, xpath),
    };
  });

  const renumbered = steps.map((s, i) => ({ ...s, order: i + 1 }));
  const guide = {
    summary: typeof parsed.summary === 'string' ? parsed.summary : input.title || 'Midscene API 步骤指南',
    assumptions: stringArray(parsed.assumptions),
    steps: renumbered,
    recommendedYamlSnippet:
      typeof parsed.recommendedYamlSnippet === 'string' ? parsed.recommendedYamlSnippet : '',
    docReferences: stringArray(parsed.docReferences),
    warnings: stringArray(parsed.warnings),
  };
  return { ...guide, markdown: formatApiGuideMarkdown(guide) };
}

// ── Heuristics: inferMidsceneApi / exampleCodeForApi / reasonForApi ───
export function inferMidsceneApi(instruction) {
  if (!instruction) return 'agent.aiTap()';
  if (/断言|验证|确认|比较|是否|相等|成功|失败/.test(instruction)) return 'agent.aiAssert()';
  if (/记录|提取|获取|读取|查找.*值|表格.*行|变量/.test(instruction)) return 'agent.aiQuery()';
  if (isTapLikeInstruction(instruction)) return 'agent.aiTap()';
  if (/输入|填写|填入/.test(instruction) || isInputLikeInstruction(instruction)) return 'agent.aiInput()';
  if (/按回车|进入|点击|选择|勾选|启用|开启|执行|打开|返回|展开|保存/.test(instruction)) return 'agent.aiTap()';
  if (/滚动|滑动|拖动|左侧|右侧|横向/.test(instruction)) return 'agent.aiScroll()';
  return 'agent.aiTap()';
}

// "点击 X 输入框" stays a tap — user is selecting the field, not typing.
// Ported from Desktop llm.ts to match its tap-vs-input disambiguation.
function isTapLikeInstruction(instruction) {
  if (!instruction) return false;
  return /^(?:点击|选择|打开|进入).*(?:输入框|输入栏|字段|框)\s*$/i.test(instruction.trim());
}

// Real "input" steps: must be a field + verb + value (no value → not input).
// e.g. "在 company code 字段 输入 8540" ✓, "点击 company code 输入框" ✗ (tap).
function isInputLikeInstruction(instruction) {
  if (!instruction) return false;
  const text = instruction.trim();
  if (/^(?:点击|选择|打开|进入).*(?:输入框|输入栏|字段|框)\s*$/i.test(text)) {
    return false;
  }
  return /(?:框|字段|输入框|TC\s*框|T-code\s*框|company code|Asset number|Report date).*?(?:搜索|搜|查询|查|输入|填写|填入)\s*\S+/i.test(text)
    || /^(?:搜索|搜|查询|查|输入|填写|填入)\s*\S+/i.test(text);
}

export function exampleCodeForApi(midsceneApi, instruction, xpath) {
  const q = JSON.stringify(instruction ?? '');
  // Wait directive (no LLM call needed).
  const waitMs = parseWaitMs(instruction);
  if (waitMs !== null) return `await sleep(${waitMs});`;
  // Scroll-extreme is best done with an explicit drag instruction.
  if (isScrollExtremeInstruction(instruction)) return formatAiScrollExampleCode(instruction);
  if (midsceneApi.includes('aiAssert')) return `await agent.aiAssert(${q});`;
  if (midsceneApi.includes('aiQuery')) {
    return `const result = await agent.aiQuery(${JSON.stringify(`string, ${instruction}`)});`;
  }
  if (midsceneApi.includes('aiScroll')) return formatAiScrollExampleCode(instruction);
  if (midsceneApi.includes('aiInput')) {
    const parsed = parseGuideInputInstruction(instruction);
    if (parsed) {
      return `await agent.aiInput(${JSON.stringify(parsed.locate)}, { value: ${JSON.stringify(parsed.value)} });`;
    }
    return `await agent.aiInput(${q});`;
  }
  if (midsceneApi.includes('aiTap')) {
    if (xpath) return `await agent.aiTap(${q}, { xpath: ${JSON.stringify(xpath)} });`;
    return `await agent.aiTap(${q});`;
  }
  return `await agent.aiTap(${q});`;
}

export function reasonForApi(midsceneApi, _instruction) {
  if (midsceneApi.includes('aiAssert')) return '结果校验或变量比较,适合断言 API。';
  if (midsceneApi.includes('aiQuery')) return '从 SAP 查询结果/表格列提取值,适合数据提取 API。';
  if (midsceneApi.includes('aiInput')) return '向明确字段输入值,拆成独立输入步骤以提升稳定性。';
  if (midsceneApi.includes('aiTap')) return '点击菜单/按钮/复选框的界面动作,适合点击 API。';
  if (midsceneApi.includes('aiScroll')) return '滚动或横向移动界面,适合滚动 API。';
  return '界面交互步骤,优先用可控的点击 API。';
}

// ── Tiny utility ports from llm.ts (just enough for exampleCodeForApi) ─

function parseWaitMs(instruction) {
  if (!instruction) return null;
  const t = instruction.trim();
  const cap = (ms) => Math.max(0, Math.min(Math.round(ms), 120_000));
  let m;
  if ((m = t.match(/(?:等待|等|稍等|wait|sleep|pause)\s*(?:为|了|时间)?\s*(\d+(?:\.\d+)?)\s*(?:毫秒|ms|millisecond)/i))) return cap(Number(m[1]));
  if ((m = t.match(/(?:等待|等|稍等|wait|sleep|pause)\s*(?:为|了|时间)?\s*(\d+(?:\.\d+)?)\s*(?:秒钟|秒|s|sec|second|seconds)/i))) return cap(Number(m[1]) * 1000);
  if ((m = t.match(/(?:等待|等|稍等|wait|sleep|pause)\s*(?:为|了|时间)?\s*(\d+(?:\.\d+)?)\s*(?:分钟|分|min|minute|minutes)/i))) return cap(Number(m[1]) * 60_000);
  if ((m = t.match(/^(?:等待|等|稍等|wait|sleep|pause)\s+(\d+(?:\.\d+)?)\s*$/i))) return cap(Number(m[1]) * 1000);
  if (/^(?:等待|等|稍等|wait|sleep|pause)(?:\s*(?:一下|片刻|一会儿?|一段时间|页面加载|加载完成|一会儿))?\s*[。.!！]?\s*$/i.test(t)) return 3000;
  return null;
}

function isScrollExtremeInstruction(instruction) {
  if (!instruction) return false;
  if (!/[滑拖]/.test(instruction)) return false;
  return /最[上下左右顶底]/.test(instruction);
}

function formatAiScrollExampleCode(instruction) {
  // For "最X端" type — emit aiAct drag (more reliable on SAP tables).
  if (isScrollExtremeInstruction(instruction)) {
    const edgeMatch = instruction.match(/最([上下左右顶底])/)?.[1];
    const map = {
      上: { bar: '右侧的纵向', edge: '最顶端' },
      顶: { bar: '右侧的纵向', edge: '最顶端' },
      下: { bar: '右侧的纵向', edge: '最底端' },
      底: { bar: '右侧的纵向', edge: '最底端' },
      左: { bar: '底部的横向', edge: '最左端' },
      右: { bar: '底部的横向', edge: '最右端' },
    };
    const cfg = map[edgeMatch] ?? { bar: '右侧的纵向', edge: '最底端' };
    return `await agent.aiAct("按住${cfg.bar}滚动条的滑块,拖到${cfg.edge}");`;
  }
  // For non-extreme scroll, just delegate to aiScroll with the instruction.
  return `await agent.aiScroll(${JSON.stringify(instruction)});`;
}

// Parse "在 X (字段|输入框|框|处) 输入/填入/搜索 Y" into {locate, value}.
// Ported 1:1 from Desktop llm.ts so locate/value extraction matches the
// apiGuides we're already running with.
function parseGuideInputInstruction(instruction) {
  if (!instruction) return null;
  const fieldMatch = instruction.match(/在\s*(.+?)\s*(?:字段|输入框|框|处)?\s*(?:输入|填入|填写|搜索|搜|查询|查)\s*(.+)$/i);
  if (fieldMatch) {
    return { locate: fieldMatch[1].trim(), value: fieldMatch[2].trim() };
  }
  // Direct-input fallback: "搜索 X" / "输入 X" / "填写 X" with no explicit field.
  const directInput = instruction.match(/^(搜索|搜|查询|查|输入|填写|填入)\s*(.+)$/i);
  if (!directInput) return null;
  const locate = /^(?:搜索|搜|查询|查)$/i.test(directInput[1])
    ? '搜索输入框'
    : '输入框';
  return { locate, value: directInput[2].trim() };
}

// ── Fallback: pure-local NL line-split. Ported 1:1 from Desktop llm.ts.
// Splits a multi-step NL paragraph into fine-grained instructions:
//   1. By leading "1." / "2、" numbered markers.
//   2. Each section through expandNaturalLanguageSection: special patterns
//      (menu-setting / favorites-navigation) get expanded into multi-step
//      sequences, then ,/;/然后/并 are used as in-section separators.
//   3. enhanceSegment turns SAP-specific shorthand ("company code输入8540")
//      into normalized "在 company code 字段 输入 8540" form so downstream
//      parseGuideInputInstruction always finds locate+value.
function splitNaturalLanguageSteps(naturalLanguage) {
  if (!naturalLanguage) return [];
  const numberedSections = naturalLanguage
    .split(/(?:^|\n)\s*\d+[.、]\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);

  if (numberedSections.length > 1) {
    return numberedSections.flatMap(expandNaturalLanguageSection);
  }

  const steps = expandNaturalLanguageSection(naturalLanguage);
  if (steps.length > 0) return steps;

  return naturalLanguage
    .split(/[。；;\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function expandNaturalLanguageSection(section) {
  const normalized = section
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .replace(/，/g, ',')
    .replace(/。/g, ';')
    .trim();

  // Special pattern: "进入 Menu... 启用/勾选 X... 保存" → explicit nav sequence.
  const menuSettingMatch = normalized.match(/在\s*(.+?)\s*(?:界面|页面).*?(启用|勾选|开启)\s*([^,;]+?)(?:,|;|并保存|保存)/i);
  if (menuSettingMatch) {
    const steps = [];
    const menuPath = menuSettingMatch[1].trim();
    const optionName = menuSettingMatch[3].trim();
    if (/Menu/i.test(menuPath)) {
      steps.push('点击 Menu 菜单');
      steps.push('点击 Settings... 选项');
    } else {
      steps.push(`进入 ${menuPath} 界面`);
    }
    if (/Visualization/i.test(menuPath)) {
      steps.push('打开 Visualization 设置页');
    }
    steps.push(`勾选 ${optionName} 复选框`);
    if (/保存/.test(normalized)) {
      steps.push('点击 Settings 弹窗底部的 Save 按钮保存设置');
    }
    return steps;
  }

  // Special pattern: "返回 SAP 主页... 选择 Favorites 下面的 X".
  // Tighten the X capture to stop at the next comma/semicolon (was [^,;]+
  // which was greedy enough in practice but lost the action chain after it),
  // then recurse on whatever's left so trailing actions like "执行Execute"
  // or "点击 X" don't get silently dropped.
  const homeFavoritesMatch = normalized.match(/返回\s*SAP\s*主页.*?选择\s*Favorites.*?下面的\s*([^,;]+?)(?=\s*[,;]|\s*$)/i);
  if (homeFavoritesMatch) {
    const target = homeFavoritesMatch[1].trim();
    const out = [
      '返回 SAP 主页',
      `展开 Favorites 文件夹并选择 ${target}`,
    ];
    const consumed = (homeFavoritesMatch.index ?? 0) + homeFavoritesMatch[0].length;
    const rest = normalized.slice(consumed).replace(/^\s*[,;]+\s*/, '').trim();
    if (rest) out.push(...expandNaturalLanguageSection(rest));
    return out;
  }

  // Generic split by , ; 然后 并且 并 (after normalization above).
  const baseSegments = normalized
    .split(/(?:[,;]+|然后|并且|并)/g)
    .map((item) => item.trim())
    .filter(Boolean);

  // Merge "查找X" with following "记录为Y" so they become one aiQuery step.
  const merged = [];
  for (let i = 0; i < baseSegments.length; i += 1) {
    const cur = baseSegments[i];
    const next = baseSegments[i + 1] ?? '';
    if (
      /^(?:查找|找|读取|获取|提取|取)/.test(cur) &&
      /^(?:记录|保存|记|存)\s*(?:为|作为|成)?\s*[A-Za-z]/.test(next)
    ) {
      merged.push(`${cur}，${next}`);
      i += 1;
    } else {
      merged.push(cur);
    }
  }

  // Consolidate "A 和 B 相等" + assertion tail fragments back into one step.
  const consolidated = [];
  for (let i = 0; i < merged.length; i += 1) {
    const cur = merged[i];
    if (isVariableComparisonSegment(cur)) {
      const parts = [cur];
      while (i + 1 < merged.length && isAssertionTailFragment(merged[i + 1])) {
        parts.push(merged[i + 1]);
        i += 1;
      }
      consolidated.push(parts.join('，'));
    } else {
      consolidated.push(cur);
    }
  }

  return consolidated.flatMap((segment) => enhanceSegment(segment));
}

function isVariableComparisonSegment(segment) {
  return /\b([A-Za-z][A-Za-z0-9_]*)\b\s*(?:和|与|跟)\s*\b([A-Za-z][A-Za-z0-9_]*)\b.*?(?:相等|不相等|一致|不一致|相同|不同)/i.test(segment)
    || /(?:对比|比较|判断|校验|断言).*?\b[A-Za-z][A-Za-z0-9_]*\b\s*(?:和|与|跟)\s*\b[A-Za-z][A-Za-z0-9_]*\b/i.test(segment);
}

function isAssertionTailFragment(segment) {
  return /^(?:不成功|不通过|不相等|不一致|不同|不相同|失败|则失败|否则失败|否则|则不通过|相等则|不相等则|成功|通过|则成功|则通过|相同|一致)/.test(segment.trim());
}

// Recognize SAP-specific shorthand and rewrite to normalized "在 X 字段 输入 Y"
// form so the downstream aiInput / aiTap / aiQuery inference is unambiguous.
function enhanceSegment(segment) {
  // TC/事务码 box → tap-then-enter sequence.
  const tcMatch = segment.match(/(?:TC\s*框|TC框|T-code框|事务码框|左上角 TC框).*?(搜索|搜|查询|查|输入)\s*([A-Z0-9_/-]+)/i);
  if (tcMatch) {
    return [
      `在左上角 TC 框${tcMatch[1]} ${tcMatch[2]}`,
      `按回车或点击进入 ${tcMatch[2]}`,
    ];
  }

  // Field shorthands: "company code输入8540" → "在 company code 字段 输入 8540".
  const fieldPatterns = [
    [/(?:company code|公司代码)\s*(?:处)?(?:输入|填入)\s*([A-Z0-9_-]+)/i, 'company code 字段'],
    [/(?:Asset number|资产编号)\s*(?:处)?(?:输入|填入)\s*([A-Z0-9_-]+)/i, 'Asset number 字段'],
    [/(?:Report date|报告日期)\s*(?:处)?(?:输入|填入)\s*([^,;]+)/i, 'Report date 字段'],
  ];
  for (const [pattern, fieldName] of fieldPatterns) {
    const match = segment.match(pattern);
    if (match) {
      return [`在 ${fieldName} 输入 ${match[1].trim()}`];
    }
  }

  if (/勾选\s*List assets/i.test(segment)) return ['勾选 List assets 复选框'];

  if (/执行\s*Execute|点击\s*Execute|Execute\s*查询/i.test(segment)) {
    return ['点击 Execute 按钮执行查询'];
  }

  // "查找 X 列的值... 记录为变量 Y" → aiQuery shape.
  const queryMatch =
    segment.match(/查找\s*([^,;]+?列)的值.*?记录为变量\s*([A-Za-z][A-Za-z0-9_]*)/i) ??
    segment.match(/记录.*?([^,;]+?列)的值为变量\s*([A-Za-z][A-Za-z0-9_]*)/i);
  if (queryMatch) {
    return [`从查询结果表格中读取 ${queryMatch[1].trim()}，保存为变量 ${queryMatch[2]}`];
  }

  // "A 和 B 相等" → comparison + pass/fail assertion (2 steps).
  const compareMatch =
    segment.match(/\b([A-Za-z][A-Za-z0-9_]*)\b\s*(?:和|与|跟)\s*\b([A-Za-z][A-Za-z0-9_]*)\b.*?(相等|不相等|一致|不一致|相同|不同)/i) ??
    segment.match(/(?:对比|比较|判断|校验|断言).*?\b([A-Za-z][A-Za-z0-9_]*)\b\s*(?:和|与|跟)\s*\b([A-Za-z][A-Za-z0-9_]*)\b.*?(相等|不相等|一致|不一致|相同|不同)?/i);
  if (compareMatch) {
    const left = compareMatch[1];
    const right = compareMatch[2];
    const rawOp = compareMatch[3] ?? '相等';
    const op = /不/.test(rawOp) ? '不相等' : '相等';
    return [`如果变量 ${left} 和 ${right} ${op}，则测试用例执行成功，否则失败`];
  }

  return [segment];
}

export function buildFallbackApiGuide(input, fallbackReason, docReferences = [], options = {}) {
  const steps = splitNaturalLanguageSteps(input.naturalLanguage).map((instruction, idx) => {
    const midsceneApi = inferMidsceneApi(instruction);
    return {
      order: idx + 1,
      title: instruction.length > 28 ? instruction.slice(0, 28) + '...' : instruction,
      midsceneApi,
      naturalLanguageInstruction: instruction,
      reason: reasonForApi(midsceneApi, instruction),
      exampleCode: exampleCodeForApi(midsceneApi, instruction),
    };
  });
  const warnings = options.localOnly
    ? [
        fallbackReason
          ? `已使用本地规则生成 API 步骤指南。原因:${fallbackReason}`
          : '已使用本地规则生成 API 步骤指南（默认走本地，设 API_GUIDE_USE_LLM=1 启用 LLM）。',
        '本地规则只做关键字拆分。执行前建议人工检查变量提取、断言和 SAP 页面定位描述。',
      ]
    : [
        `模型生成未成功,已使用本地规则生成降级指南。原因:${fallbackReason}`,
        '降级指南只做关键字拆分。执行前建议人工检查变量提取、断言和 SAP 页面定位描述。',
      ];
  const guide = {
    summary: input.title || '根据自然语言生成 Midscene API 步骤指南',
    assumptions: input.targetUrl ? [`从 ${input.targetUrl} 开始执行。`] : [],
    steps,
    recommendedYamlSnippet: '',
    docReferences,
    warnings,
  };
  return { ...guide, markdown: formatApiGuideMarkdown(guide) };
}

// ── Dynamic date-expression resolver ──────────────────────────────────
// Ported 1:1 from Desktop\saptest\src\lib\llm.ts lines 1112–1216.
// aiInput values like "上个月的最后一个自然日" / "today" / "本月月底" are
// natural-language date expressions, not literal strings to type. Detect
// them and ask the LLM to resolve to a concrete date (DD.MM.YYYY for SAP).
// Explicit dates (30.04.2026 / 2026-04-30) and non-date values pass through.
const dynamicValueCache = new Map();

function isExplicitDateValue(value) {
  return /^\s*(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})\s*$/.test(value);
}

function needsDynamicDateResolution(value) {
  const text = String(value ?? '').trim();
  if (!text || isExplicitDateValue(text)) return false;
  return /(?:今天|今日|明天|昨日|昨天|前天|后天|本[年月周季]|这[个]?[年月周季]|上[个]?[年月周季]|下[个]?[年月周季]|去年|明年|前年|后年|月初|月末|月底|年初|年底|季度|季末|自然日|工作日|第\d+[天日]|last|next|previous|today|tomorrow|yesterday|month|year|quarter|weekday|business day)/i.test(text);
}

function currentLocalDateText(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function askLlmToResolveDynamicDateValue(value, context) {
  const cacheKey = JSON.stringify({
    value,
    field: context?.field ?? '',
    date: currentLocalDateText(),
  });
  const cached = dynamicValueCache.get(cacheKey);
  if (cached) return cached;

  const { apiKey, baseUrl, model } = getYamlConverterConfig();
  configureLlmProxy();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: [
            'You resolve dynamic date expressions for SAP automation.',
            'Return only valid JSON with shape {"value":"..."}.',
            'The value must be the final input string for SAP date fields.',
            'Use date format DD.MM.YYYY unless the user explicitly requests another format.',
            'Do not include explanations.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            `Current date: ${currentLocalDateText()}`,
            `Field: ${context?.field || 'unknown'}`,
            `Instruction: ${context?.instruction || ''}`,
            `Expression to resolve: ${value}`,
          ].join('\n'),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`动态日期解析失败：${response.status} ${await response.text()}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('动态日期解析模型没有返回内容。');

  const parsed = JSON.parse(stripCodeFence(content));
  const resolved = typeof parsed.value === 'string' && parsed.value.trim()
    ? parsed.value.trim()
    : value;
  dynamicValueCache.set(cacheKey, resolved);
  return resolved;
}

export async function resolveDynamicInputValue(value, context) {
  if (!needsDynamicDateResolution(value)) return value;
  return askLlmToResolveDynamicDateValue(value, context);
}

// ── Markdown formatter for the apiGuide ───────────────────────────────
export function formatApiGuideMarkdown(guide) {
  const lines = [`## ${guide.summary || 'Midscene API 步骤指南'}`, ''];
  if (guide.assumptions.length > 0) {
    lines.push('### 前提假设', ...guide.assumptions.map((s) => `- ${s}`), '');
  }
  lines.push('### API 步骤');
  for (const step of guide.steps) {
    lines.push(
      `${step.order}. ${step.title}`,
      `   - API: \`${step.midsceneApi}\``,
      `   - 指令: ${step.naturalLanguageInstruction}`,
      `   - 原因: ${step.reason}`,
      `   - 示例: \`${step.exampleCode}\``,
    );
  }
  if (guide.recommendedYamlSnippet?.trim()) {
    lines.push('', '### YAML 参考', '```yaml', guide.recommendedYamlSnippet, '```');
  }
  if (guide.docReferences.length > 0) {
    lines.push('', '### 参考文档', ...guide.docReferences.map((s) => `- ${s}`));
  }
  if (guide.warnings.length > 0) {
    lines.push('', '### 注意事项', ...guide.warnings.map((s) => `- ${s}`));
  }
  return lines.join('\n');
}
