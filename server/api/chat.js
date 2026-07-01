// /api/chat — in-app AI helper for the Case Studio + Run Center chat widget.
//
// System prompt = STATIC_PRELUDE + <KB> + STATIC_POSTLUDE.
// Two KBs by audience, picked per request via `context.app`:
//   - 'case-studio' → studio-kb-dev.md (developer-focused)
//   - anything else / unset → studio-kb.md (end-user / Run Center)
// Both KBs hot-reload on file change. Edit the KB to update what the AI
// knows — no code change required.

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const router = express.Router();
router.use(requireAuth(), requirePermission('agent:use'));

const KB_PATHS = {
  // 'run-center' (default) — end-user audience
  user: path.join(__dirname, '..', 'data', 'studio-kb.md'),
  // 'case-studio' — developer audience
  dev:  path.join(__dirname, '..', 'data', 'studio-kb-dev.md'),
};

const KB_TEXT = { user: '', dev: '' };

function loadKb(key) {
  const p = KB_PATHS[key];
  try {
    KB_TEXT[key] = fs.readFileSync(p, 'utf8');
    console.log(`[chat] KB '${key}' loaded · ${KB_TEXT[key].length} chars from ${path.relative(process.cwd(), p)}`);
  } catch (e) {
    console.warn(`[chat] failed to load KB '${key}' at ${p}: ${e.message}. Falling back to minimal prompt.`);
    KB_TEXT[key] = `(${key} 知识库文件未加载 — 只能给非常通用的答复)`;
  }
}
loadKb('user');
loadKb('dev');

// Live-reload — every change to either KB file is picked up without restart.
// Best-effort; ignored on platforms where fs.watch is flaky.
for (const key of Object.keys(KB_PATHS)) {
  try {
    fs.watch(KB_PATHS[key], { persistent: false }, () => {
      setTimeout(() => loadKb(key), 50);
    });
  } catch { /* fs.watch not available — KB still works, just no hot reload */ }
}

const STATIC_PRELUDE = `你是 SAP WebGUI 测试自动化项目的助手 (Studio Assistant)，嵌入在网页右下角的 chat 里。

下面是你的**唯一权威知识库** — 用户问任何关于 Case Studio / Run Center 的 UI 操作问题，
都必须从这份 KB 里查。**任何不在 KB 里出现的 tab 名 / 按钮名 / 菜单项都不存在，
回答时绝对不许编造。**

如果用户问的事 KB 没覆盖，直接说"我不确定这个具体在哪，建议看 How-to tab 或
Cache Debug 教程 tab"，不要瞎编。

如果用户附了截图，截图只是参考 — KB 仍然是权威。截图渲染可能有损，
不要因为截图里看着像有某按钮就编造按钮名。

═══════════════════════════════════════════════════════════════════
📚 KNOWLEDGE BASE BEGINS
═══════════════════════════════════════════════════════════════════

`;

const STATIC_POSTLUDE = `

═══════════════════════════════════════════════════════════════════
📚 KNOWLEDGE BASE ENDS
═══════════════════════════════════════════════════════════════════

回答格式要求：
- markdown 可用：**加粗** / *斜体* / \`code\` / 列表 (- 或 1.) / # 小标题
- 3-6 行能讲完就讲完，不要长篇大论
- 按钮名**完整准确**写出，用 **粗体** 或 \`code\`
- 动作建议用编号列表：1. 去哪个 tab → 2. 点哪个按钮 → 3. 看到什么
- 用中文回答（除非用户用英文问）
- **不确定就承认不确定**，不许编造`;

// Pick the KB by caller app. `case-studio` → developer KB; everything else
// (Run Center, missing field, unknown value) → end-user KB. The default is
// the user KB because it's the larger audience and a developer who happens
// to be missing the `app` field will still get useful answers.
function pickKb(app) {
  return app === 'case-studio' ? KB_TEXT.dev : KB_TEXT.user;
}

function buildSystemPrompt(app) {
  return STATIC_PRELUDE + pickKb(app) + STATIC_POSTLUDE;
}

router.post('/', async (req, res) => {
  const { message, context, model } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length < 1) {
    return res.status(400).json({ error: 'message is required' });
  }

  const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL;
  const apiKey  = process.env.MIDSCENE_MODEL_API_KEY;
  const modelName = model || process.env.MIDSCENE_MODEL_NAME;
  if (!baseUrl || !apiKey || !modelName) {
    return res.status(503).json({
      error: 'AI model not configured — set MIDSCENE_MODEL_BASE_URL / MIDSCENE_MODEL_API_KEY / MIDSCENE_MODEL_NAME in .env',
    });
  }

  // Build a short context paragraph from whatever the UI sent. KB has the
  // authoritative UI; context just tells the model what the user sees now.
  const ctxLines = [];
  if (context) {
    if (context.caseId)        ctxLines.push(`当前 case: ${context.caseId}${context.caseTitle ? ' · ' + context.caseTitle : ''}`);
    if (context.section)       ctxLines.push(`当前 tab: ${context.section}`);
    if (context.stepCount != null) ctxLines.push(`apiGuide 步骤数: ${context.stepCount}`);
    if (context.runMode)       ctxLines.push(`选中的 run mode: ${context.runMode}`);
    if (context.lastRunStatus) ctxLines.push(`上次 run 结果: ${context.lastRunStatus}`);
    if (context.lastError)     ctxLines.push(`上次错误信息（截断）: ${String(context.lastError).slice(0, 400)}`);
    if (Array.isArray(context.lastLogTail) && context.lastLogTail.length) {
      ctxLines.push('最近 logTail 末尾:\n' + context.lastLogTail.slice(-8).join('\n'));
    }
  }
  const contextBlock = ctxLines.length
    ? `\n\n[用户当前看到的状态 — 仅供参考，KB 仍是权威]\n${ctxLines.join('\n')}`
    : '';

  await audit(req, 'chat.request', {
    msgChars: message.length,
    app: context?.app,
    sec: context?.section,
    caseId: context?.caseId,
    hasScreenshot: !!context?.screenshot,
  });

  // Multimodal: if the client sent a PNG data URL (now using html2canvas
  // for a real PNG instead of an SVG hack), we pass it as image_url.
  // DashScope's qwen-vl-plus accepts the OpenAI-compatible vision format.
  const userContent = context?.screenshot
    ? [
        { type: 'text', text: message + contextBlock },
        { type: 'image_url', image_url: { url: context.screenshot } },
      ]
    : message + contextBlock;

  let resp;
  try {
    resp = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: buildSystemPrompt(context?.app) },
          { role: 'user', content: userContent },
        ],
        // 0.7 gives noticeable wording variation on identical questions
        // while still keeping the model anchored to the KB. 0.3 felt
        // canned to users — same question, near-identical reply.
        temperature: 0.7,
        max_tokens: 900,
      }),
    });
  } catch (e) {
    return res.status(502).json({ error: 'model request failed', detail: e.message });
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return res.status(resp.status).json({ error: `model returned ${resp.status}`, detail: text.slice(0, 600) });
  }
  const body = await resp.json().catch(() => null);
  const reply = body?.choices?.[0]?.message?.content;
  if (!reply) return res.status(502).json({ error: 'model returned no content' });

  await audit(req, 'chat.reply', { replyChars: reply.length });
  res.json({ reply });
});

export default router;
