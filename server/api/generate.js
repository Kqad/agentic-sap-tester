// /api/generate — natural-language → test-case JSON agent.
// Calls the configured OpenAI-compatible chat-completions endpoint with a
// system prompt that instructs the model to return ONLY JSON matching the
// shape used by e2e/cases/*.json. The endpoint never writes files itself —
// the UI shows the JSON and the user clicks "Save as new case" to persist.

import express from 'express';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';

const router = express.Router();
router.use(requireAuth(), requirePermission('agent:use'));

const SYSTEM_PROMPT = `你是 SAP WebGUI 自动化测试的"自然语言 → JSON 用例参数"翻译器。

输入：用户用自然语言描述一个 SAP WebGUI 测试用例（通常包含 SAP URL、事务码、查询字段、要校验的列）。

任务：把它转成本项目的标准用例参数 JSON。形状如下（字段可裁剪，仅保留用户提到或合理默认的）：

{
  "$schema": "Parameters for <kebab-id>.spec.ts",
  "title": "<短标题>",
  "sapUrl": "https://mhl.wdisp.bosch.com/sap/bc/gui/sap/its/webgui#",
  "transactionCode": "S_ALR_87011990",
  "favoritesEntry": "Asset Balances",
  "query": {
    "companyCode": "8540",
    "assetNumber": "1010001732",
    "reportDate": "30.04.2026",
    "listAssets": true
  },
  "extract": {
    "a1ColumnLabel": "Curr.bk.val.",
    "a1Source": "<人话说明 a1 从哪儿取>",
    "a2ColumnLabel": "Book val.",
    "a2Source": "<人话说明 a2 从哪儿取>"
  },
  "assertion": "<比如 a1 == a2>"
}

规则：
1. 严格只输出 JSON 对象，无 markdown、无解释、无前后缀。
2. 用户没说的字段不要硬编。
3. 如果用户提到中文字段名（如"公司代码"），映射为 SAP 英文标签（"Company code"）。
4. 日期保留用户给的格式；如果只说"今天"就用 ISO YYYY-MM-DD。
5. 给一个合适的 kebab-case id，写进 $schema 里。`;

router.post('/case', async (req, res) => {
  const { prompt, model } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'prompt is required (>=3 chars)' });
  }
  const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL;
  const apiKey  = process.env.MIDSCENE_MODEL_API_KEY;
  const modelName = model || process.env.MIDSCENE_MODEL_NAME;
  if (!baseUrl || !apiKey || !modelName) {
    return res.status(503).json({
      error: 'AI model not configured — set MIDSCENE_MODEL_BASE_URL / MIDSCENE_MODEL_API_KEY / MIDSCENE_MODEL_NAME in .env',
    });
  }
  await audit(req, 'agent.generate.request', { promptChars: prompt.length, model: modelName });

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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });
  } catch (e) {
    return res.status(502).json({ error: 'model request failed', detail: e.message });
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return res.status(resp.status).json({
      error: `model returned ${resp.status}`,
      detail: text.slice(0, 800),
    });
  }
  const body = await resp.json().catch(() => null);
  const content = body?.choices?.[0]?.message?.content;
  if (!content) return res.status(502).json({ error: 'model returned no content', raw: body });

  // The model usually obeys "JSON only", but sometimes wraps in ```json fences.
  let jsonText = content.trim();
  const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) jsonText = fence[1].trim();

  let parsed = null, parseError = null;
  try { parsed = JSON.parse(jsonText); }
  catch (e) { parseError = e.message; }

  // Derive a suggested id from $schema or title
  let suggestedId = null;
  if (parsed && typeof parsed === 'object') {
    const fromSchema = String(parsed.$schema || '').match(/Parameters for ([a-zA-Z0-9_\-]+)\.spec\.ts/);
    if (fromSchema) suggestedId = fromSchema[1];
    else if (parsed.title) suggestedId = slugify(parsed.title);
  }

  await audit(req, 'agent.generate.response', { parsed: !!parsed, parseError });
  res.json({ raw: content, jsonText, parsed, parseError, suggestedId });
});

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[^\w\s\-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'generated-case';
}

export default router;
