// /api/search/projects — semantic project search.
//
// The Run Center "My Projects" filter has a literal substring + tiny
// hardcoded pinyin matcher running client-side. This endpoint adds a
// semantic / fuzzy layer: the client sends the user's query plus the
// (lightweight) project metadata it has in memory, and we ask the
// configured chat model (Qwen via DashScope) to pick which projects
// the query is actually about.
//
// Why a server-side endpoint instead of a direct client call: the
// model API key is server-only, and we want to audit the request.
// Why this isn't part of /api/chat: chat ships the studio KB which
// would confuse the model on this very different task.

import express from 'express';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';

const router = express.Router();
router.use(requireAuth(), requirePermission('agent:use'));

const SYSTEM_PROMPT = `你是一个项目搜索器。

输入：
- query: 用户输入的搜索字符串（中文 / 拼音 / 英文 / 部门名 / 自由描述 都可能）
- projects: 一个数组，每个元素是 { id, name, business, caseIds }

任务：返回 query 在语义上最相关的 project 的 id 列表。
- 中文 → 拼音 / 拼音 → 中文 应该都能匹配（"caiwu" 匹配 "财务"；"运营" 匹配 "Operations"）
- 行业 / 部门 / 模块 别名也能匹配（"AP" 匹配 "Accounts Payable" / "应付"）
- 模糊匹配但要保守 — 宁可少返回，也不要把毫不相关的 project 拽进来
- 只看 name / business / caseIds，不要瞎猜不存在的字段

输出格式（严格 JSON，没有 markdown 没有解释）：
{ "matchedIds": ["proj-id-1", "proj-id-2", ...] }

如果没有相关 project，返回 { "matchedIds": [] }。`;

router.post('/projects', async (req, res) => {
  const { query, projects } = req.body || {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'projects array is required' });
  }
  // Cap to keep prompt size sane. 200 projects is well above realistic.
  if (projects.length > 200) {
    return res.status(413).json({ error: 'too many projects (max 200)' });
  }

  const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL;
  const apiKey  = process.env.MIDSCENE_MODEL_API_KEY;
  const modelName = process.env.MIDSCENE_MODEL_NAME;
  if (!baseUrl || !apiKey || !modelName) {
    return res.status(503).json({
      error: 'AI model not configured — set MIDSCENE_MODEL_BASE_URL / MIDSCENE_MODEL_API_KEY / MIDSCENE_MODEL_NAME in .env',
    });
  }

  // Strip out anything client might send beyond the four fields we use.
  // Keeps the prompt small and avoids leaking incidental data into the
  // model context.
  const slim = projects.map((p) => ({
    id: String(p.id || ''),
    name: String(p.name || ''),
    business: String(p.business || ''),
    caseIds: Array.isArray(p.caseIds) ? p.caseIds.slice(0, 50).map(String) : [],
  })).filter((p) => p.id);

  await audit(req, 'search.projects', {
    query, projectCount: slim.length, model: modelName,
  });

  const userPayload = JSON.stringify({ query: query.trim(), projects: slim });

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
          { role: 'user', content: userPayload },
        ],
        // Low temperature — we want deterministic matching, not creativity.
        temperature: 0.1,
        max_tokens: 600,
      }),
    });
  } catch (e) {
    return res.status(502).json({ error: 'model request failed', detail: e.message });
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return res.status(resp.status).json({
      error: `model returned ${resp.status}`,
      detail: text.slice(0, 600),
    });
  }
  const body = await resp.json().catch(() => null);
  const reply = body?.choices?.[0]?.message?.content;
  if (!reply) return res.status(502).json({ error: 'model returned no content' });

  // Parse the JSON the model returned. Sometimes it wraps in ```json
  // fences despite our instruction; strip those before parsing.
  const stripped = reply.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch (e) {
    return res.status(502).json({
      error: 'model returned invalid JSON',
      detail: stripped.slice(0, 300),
    });
  }
  const matchedIds = Array.isArray(parsed?.matchedIds)
    ? parsed.matchedIds.map(String).filter(Boolean)
    : [];
  // Sanity filter: only return ids the client actually sent (so the
  // model can't hallucinate a project that doesn't exist).
  const validIds = new Set(slim.map((p) => p.id));
  const filtered = matchedIds.filter((id) => validIds.has(id));
  return res.json({ matchedIds: filtered });
});

// ── /api/search/parse-date — natural-language date parsing ──────────
// The client already does regex parsing for explicit forms ("6月29号",
// "6/29", "今天", "上周"). This endpoint handles the fuzzier stuff that
// regex won't cover: "六月中旬", "上个月最后一周", "最近三天", etc.
//
// Returns { startDate, endDate } as ISO date-only strings (YYYY-MM-DD)
// or null when no date intent was detected. The client merges this
// into its date filter same way as the regex output.
const DATE_PROMPT = `你是一个中文日期解析器。

输入：一个可能包含日期表达的中文/英文字符串。
当前日期：__TODAY__
当前时区：Asia/Shanghai

任务：
- 如果文本中包含日期范围意图（"上周"、"6月中旬"、"最近三天"、"3月29到6月28"等），返回起止日期
- 如果只有单个日期，startDate 和 endDate 相同
- 如果文本中没有任何日期意图（纯项目名 / case id），返回 null

输出格式（严格 JSON，没有 markdown 没有解释）：
{ "startDate": "2026-06-01" or null, "endDate": "2026-06-30" or null }

如果无日期：{ "startDate": null, "endDate": null }`;

router.post('/parse-date', async (req, res) => {
  const { query } = req.body || {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }
  const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL;
  const apiKey  = process.env.MIDSCENE_MODEL_API_KEY;
  const modelName = process.env.MIDSCENE_MODEL_NAME;
  if (!baseUrl || !apiKey || !modelName) {
    return res.status(503).json({ error: 'AI model not configured' });
  }
  await audit(req, 'search.parse-date', { query, model: modelName });

  const today = new Date().toISOString().slice(0, 10);
  const prompt = DATE_PROMPT.replace('__TODAY__', today);

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
          { role: 'system', content: prompt },
          { role: 'user', content: query.trim() },
        ],
        temperature: 0.0,
        max_tokens: 120,
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

  const stripped = reply.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch (e) {
    return res.status(502).json({ error: 'model returned invalid JSON', detail: stripped.slice(0, 300) });
  }
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const startDate = (parsed?.startDate && iso.test(parsed.startDate)) ? parsed.startDate : null;
  const endDate   = (parsed?.endDate   && iso.test(parsed.endDate))   ? parsed.endDate   : null;
  return res.json({ startDate, endDate });
});

export default router;
