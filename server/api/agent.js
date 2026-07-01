// /api/agent/plan — Run Center AI Workbench planner.
//
// Takes a natural-language request + the page's current context
// (available businesses, category enum, recent projects) and asks the
// configured Qwen model to return a JSON sequence of tool calls the
// frontend can execute. The tool surface lives in
// server/data/automation-kb.md; this file just wires the prompt and
// validates / sanitises the model output before handing it back.

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

// ── Knowledge base load (with hot reload) ─────────────────────────────
const KB_PATH = path.join(__dirname, '..', 'data', 'automation-kb.md');
let KB_TEXT = '';
function loadKb() {
  try {
    KB_TEXT = fs.readFileSync(KB_PATH, 'utf8');
    console.log(`[agent] KB loaded · ${KB_TEXT.length} chars from ${path.relative(process.cwd(), KB_PATH)}`);
  } catch (e) {
    console.warn(`[agent] failed to load KB at ${KB_PATH}: ${e.message}`);
    KB_TEXT = '(automation-kb.md 未加载 — agent 将无法工作)';
  }
}
loadKb();
try {
  fs.watch(KB_PATH, { persistent: false }, () => setTimeout(loadKb, 50));
} catch { /* fs.watch unavailable — ignore */ }

// ── Allow-lists (mirrors what the frontend dispatcher can execute) ──
const ALLOWED_TOOLS = new Set([
  'createProjects',
  'runLatestProjects',
  'runProject',
  'openProject',
  'openLiveChannels',
  'openLatestFailedReport',
  'openLatestRunReport',
  'openFailureAnalytics',
  'openSection',
  'queryEntities',
  'queryStats',
  'highlightProjects',
]);
const ALLOWED_QUERY_ENTITIES = new Set(['case', 'project', 'business']);
const ALLOWED_QUERY_SORTS = new Set(['recent', 'name', 'count_desc']);
const ALLOWED_STATS_GROUP = new Set(['category', 'business']);
const ALLOWED_STATS_COUNT = new Set(['case', 'project']);
const ALLOWED_SECTIONS = new Set([
  'run-center', 'my-projects', 'live-channels',
  'case-library', 'reports', 'failures',
]);
const ALLOWED_ACTIONS = new Set(['save', 'run']);
const ALLOWED_PROJECT_KINDS = new Set(['latest', 'latestByBusiness', 'byName']);

function normalizeCaseRefText(text) {
  return String(text || '')
    .replace(/[一壹]/g, '1')
    .replace(/[二两俩贰]/g, '2')
    .replace(/[三叁]/g, '3')
    .replace(/[四肆]/g, '4')
    .replace(/[五伍]/g, '5')
    .replace(/[六陆]/g, '6')
    .replace(/[七柒]/g, '7')
    .replace(/[八捌]/g, '8')
    .replace(/[九玖]/g, '9')
    .replace(/[零〇]/g, '0');
}

function pickAvailableBusiness(ctx, candidates, fallback = '') {
  const available = (ctx?.availableBusinesses || []).map(String).filter(Boolean);
  const byLower = new Map(available.map((b) => [b.toLowerCase(), b]));
  for (const c of candidates || []) {
    const key = String(c || '').trim().toLowerCase();
    if (key && byLower.has(key)) return byLower.get(key);
  }
  return fallback || '';
}

function businessAliasFromText(raw, ctx) {
  const text = String(raw || '').toLowerCase();
  if (/(?:\u7814\u53d1|\u7814\u767c|\br\s*&\s*d\b|\brnd\b|\bresearch\s*(?:and|&)?\s*development\b)/i.test(raw)) {
    return pickAvailableBusiness(ctx, ['R&D', 'Research', '\u7814\u53d1', '\u7814\u767c'], 'R&D');
  }
  if (/(?:\u4eba\u529b|\u4eba\u4e8b|\bhr\b|human resources?)/i.test(raw)) {
    return pickAvailableBusiness(ctx, ['\u4eba\u529b', 'HR', 'Human Resources'], '\u4eba\u529b');
  }
  if (/finance|financial/.test(text)) return pickAvailableBusiness(ctx, ['Finance', '\u8d22\u52a1', '\u8ca1\u52d9'], 'Finance');
  if (/logistics|shipping|transport/.test(text)) return pickAvailableBusiness(ctx, ['Logistics', '\u7269\u6d41'], 'Logistics');
  if (/warehouse|wms/.test(text)) return pickAvailableBusiness(ctx, ['Warehouse', '\u4ed3\u50a8', '\u5009\u5132'], 'Warehouse');
  if (/sales|\bsd\b/.test(text)) return pickAvailableBusiness(ctx, ['Sales', '\u9500\u552e', '\u92b7\u552e'], 'Sales');
  return '';
}

function explicitCaseIdsFromMessage(message, ctx) {
  const text = normalizeCaseRefText(message);
  const valid = new Set((ctx?.cases || []).map((c) => String(c?.id || '')).filter(Boolean));
  const out = new Set();
  const add = (n) => {
    const id = `saptest${Number(n)}`;
    if (!valid.size || valid.has(id)) out.add(id);
  };

  for (const m of text.matchAll(/\bsap\s*test\s*(\d{1,3})\b/gi)) add(m[1]);
  for (const m of text.matchAll(/\bsaptest\s*(\d{1,3})\b/gi)) add(m[1]);
  for (const m of text.matchAll(/\btest\s*case\s*(\d{1,3})\b/gi)) add(m[1]);
  for (const m of text.matchAll(/\bcase\s*(\d{1,3})\b/gi)) add(m[1]);
  for (const m of text.matchAll(/(?:cases?|test\s*cases?|saptests?|选\s*case|选择\s*case|包含\s*case)\s*((?:\d{1,3}\s*(?:[,，、]|和|and)?\s*){1,20})/gi)) {
    for (const n of m[1].matchAll(/\d{1,3}/g)) add(n[0]);
  }
  return [...out];
}

function explicitBusinessFromMessage(message, ctx) {
  const raw = String(message || '');
  const text = raw.toLowerCase();
  const available = (ctx?.availableBusinesses || []).map(String).filter(Boolean);
  const hasBusinessMarker = /(?:business|department|dept|部门|部門|业务|業務)\s*(?:是|为|為|=|:)?/i.test(raw)
    || /用户补充\s*[:：]/.test(raw);
  if (!hasBusinessMarker) return '';
  for (const b of available) {
    if (b && text.includes(b.toLowerCase())) return b;
  }
  const alias = businessAliasFromText(raw, ctx);
  if (alias) return alias;
  if (/物流/.test(raw)) return available.find((b) => b === '物流') || '物流';
  if (/仓储|倉儲/.test(raw)) return available.find((b) => b === '仓储') || '仓储';
  if (/财务|財務/.test(raw)) return available.find((b) => b === '财务') || available.find((b) => /^finance$/i.test(b)) || '财务';
  if (/销售|銷售/.test(raw)) return available.find((b) => b === '销售') || available.find((b) => /^sales$/i.test(b)) || '销售';
  return '';
}

function valueWasExplicitlySupplied(message, value, fieldNames = []) {
  const raw = String(message || '');
  const val = String(value || '').trim();
  if (!val) return false;
  const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const valLower = val.toLowerCase();
  const supplementLines = [...raw.matchAll(/用户补充\s*[:：]\s*([^\n]+)/g)].map((m) => m[1] || '');
  if (supplementLines.some((line) => line.toLowerCase().includes(valLower))) return true;
  if (new RegExp(`用户补充\\s*[:：]\\s*${escaped}(?=$|\\s|[，,；;。])`, 'i').test(raw)) return true;
  if (!fieldNames.length) return raw.toLowerCase().includes(val.toLowerCase());
  const fieldPattern = fieldNames.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`(?:${fieldPattern})\\s*(?:是|为|為|=|:)?\\s*[^\\n，,；;。]*${escaped}`, 'i').test(raw);
}

function categoryWasExplicitlySupplied(message, categoryKey, ctx) {
  const key = String(categoryKey || '').trim();
  if (!key) return false;
  const cat = (ctx?.categories || []).find((c) => c.key === key);
  const labels = [key, cat?.label].filter(Boolean);
  return labels.some((label) =>
    valueWasExplicitlySupplied(message, label, [
      'category', 'primary category', 'label', '标签', '標籤', '分类', '分類', '类别', '類別',
    ]));
}

function explicitCategoryKeysFromMessage(message, ctx) {
  const raw = String(message || '');
  const supplementLines = [...raw.matchAll(/用户补充\s*[:：]\s*([^\n]+)/g)].map((m) => m[1] || '');
  const categoryFieldLines = [...raw.matchAll(/(?:category|primary category|label|标签|標籤|分类|分類|类别|類別)\s*(?:是|为|為|=|:)?\s*([^\n]+)/gi)]
    .map((m) => m[1] || '');
  const haystacks = [...supplementLines, ...categoryFieldLines].map((s) => s.toLowerCase());
  if (!haystacks.length) return [];
  const keys = [];
  for (const cat of ctx?.categories || []) {
    const key = String(cat?.key || '').trim();
    const label = String(cat?.label || '').trim();
    if (!key) continue;
    const needles = [key, label].filter(Boolean).map((s) => s.toLowerCase());
    if (haystacks.some((line) => needles.some((needle) => line.includes(needle)))) keys.push(key);
  }
  return [...new Set(keys)];
}

function projectNameFromMessage(message) {
  const raw = String(message || '');
  const quoted = raw.match(/["'“”「『](.+?)["'“”」』]/);
  if (quoted?.[1]) return quoted[1].trim().slice(0, 80);
  const namePattern = /(?:name|named|called|\u540d\u5b57|\u540d\u79f0|\u540d\u7a31|\u53eb|\u540d\u4e3a|\u540d\u70ba)\s*(?:\u662f|\u4e3a|\u70ba|=|:)?\s*([^\n,，;；。]{2,80})/i;
  const m = raw.match(namePattern);
  if (!m?.[1]) return '';
  return m[1]
    .replace(/\s*(?:\u7684)?\s*(?:project|\u9879\u76ee|\u9805\u76ee|department|business|\u90e8\u95e8|\u90e8\u9580|category|label).*$/i, '')
    .trim()
    .slice(0, 80);
}

function deterministicCreateProjectsFromMessage(message, ctx) {
  const name = projectNameFromMessage(message);
  const business = explicitBusinessFromMessage(message, ctx);
  const explicitCaseIds = explicitCaseIdsFromMessage(message, ctx);
  const explicitCategoryKeys = explicitCategoryKeysFromMessage(message, ctx);
  const validBusinesses = new Set((ctx?.availableBusinesses || []).map((b) => String(b).toLowerCase()));
  if (!name || !business || (validBusinesses.size && !validBusinesses.has(String(business).toLowerCase()))) return [];

  const validCaseIds = new Set((ctx?.cases || []).map((c) => String(c?.id || '')).filter(Boolean));
  const caseIds = explicitCaseIds.length
    ? explicitCaseIds
    : (explicitCategoryKeys.length
        ? (ctx?.cases || [])
            .filter((c) => explicitCategoryKeys.includes(String(c?.category || '')))
            .map((c) => String(c.id || '').trim())
            .filter(Boolean)
        : []);
  const cleanCaseIds = [...new Set(caseIds)].filter((id) => !validCaseIds.size || validCaseIds.has(id)).slice(0, 50);
  if (!cleanCaseIds.length) return [];

  const action = /create\s*&\s*run|\brun\b|\u8dd1|\u8fd0\u884c|\u904b\u884c|\u7acb\u5373/.test(String(message || ''))
    && !/save only|\u53ea\u4fdd\u5b58|\u4ec5\u4fdd\u5b58|\u5148\u4fdd\u5b58/.test(String(message || ''))
    ? 'run'
    : 'save';
  return [{
    tool: 'createProjects',
    args: {
      projects: [{
        name,
        business,
        categoryKey: null,
        caseIds: cleanCaseIds,
        labels: explicitCategoryKeys,
        runsPerCase: 1,
        action,
      }],
    },
  }];
}

function createProjectClarification(rawToolCalls, sanitizedToolCalls, ctx, message) {
  const rawCreates = Array.isArray(rawToolCalls)
    ? rawToolCalls.filter((c) => c?.tool === 'createProjects')
    : [];
  if (!rawCreates.length) return null;
  const keptCreates = sanitizedToolCalls.filter((c) => c?.tool === 'createProjects');
  if (keptCreates.length) return null;

  const projects = rawCreates.flatMap((c) => Array.isArray(c?.args?.projects) ? c.args.projects : []);
  const hasName = projects.some((p) => String(p?.name || '').trim());
  const explicitCaseIds = explicitCaseIdsFromMessage(message, ctx);
  const explicitCategoryKeys = explicitCategoryKeysFromMessage(message, ctx);
  const hasCaseSignal = /\b(?:cases?|test\s*cases?|saptests?)\b|case\s*\d|用例|選|选/.test(normalizeCaseRefText(message));
  const hasCaseOrCategory = explicitCaseIds.length > 0 || explicitCategoryKeys.length > 0 || projects.some((p) => {
    const categoryKey = String(p?.categoryKey || '').trim();
    const caseIds = Array.isArray(p?.caseIds) ? p.caseIds.filter(Boolean) : [];
    return categoryWasExplicitlySupplied(message, categoryKey, ctx) || (hasCaseSignal && caseIds.length);
  });

  if (!hasName) {
    return {
      question: '这个 project 叫什么名字？',
      kind: 'input',
      field: 'name',
      suggestions: [],
    };
  }
  if (!explicitBusinessFromMessage(message, ctx)) {
    return {
      question: '这个 project 的部门 / business 是什么？',
      kind: 'choice',
      field: 'business',
      suggestions: (ctx?.availableBusinesses || []).slice(0, 6).map(String),
    };
  }
  if (!hasCaseOrCategory) {
    return {
      question: '这个 project 要包含哪些 case，或选择哪个 Primary Category？',
      kind: 'choice',
      field: 'category',
      suggestions: (ctx?.categories || []).slice(0, 6).map((c) => c.label || c.key).filter(Boolean),
    };
  }
  return null;
}

// Shared shape used by openProject + runProject. Pulls the LLM's selector
// fields into a tight, validated payload. Only `business` is enum-checked
// (must match availableBusinesses AND be mentioned in the user's text —
// same rule as createProjects, so the LLM can't silently pick a default).
// The date strings pass through as-is; the frontend does the actual
// "yesterday" / "last-7-days" resolution against local time.
const ALLOWED_SELECTOR_SORT = new Set(['recent', 'oldest']);
function sanitizeProjectSelector(args, ctx, message) {
  const validBusinesses = new Set((ctx?.availableBusinesses || []).map((b) => String(b).toLowerCase()));
  const modelBusiness = args.business ? String(args.business).trim() : '';
  const explicit = explicitBusinessFromMessage(message, ctx);
  const business = (explicit && validBusinesses.has(explicit.toLowerCase()))
    ? explicit
    : (modelBusiness
        && validBusinesses.has(modelBusiness.toLowerCase())
        && valueWasExplicitlySupplied(message, modelBusiness, ['business', 'department', 'dept', '部门', '部門', '业务', '業務']))
      ? modelBusiness
      : null;
  const name = args.name ? String(args.name).trim().slice(0, 80) : null;
  const createdSince  = args.createdSince  ? String(args.createdSince).trim().slice(0, 40)  : null;
  const createdBefore = args.createdBefore ? String(args.createdBefore).trim().slice(0, 40) : null;
  const passedOnly = args.passedOnly === true;
  const sortBy = ALLOWED_SELECTOR_SORT.has(args.sortBy) ? args.sortBy : 'recent';
  return { business, name, createdSince, createdBefore, passedOnly, sortBy };
}

// ── Sanitiser — strips anything that doesn't match the schema. ──────
// The model is told the schema in the KB, but never trust the output.
// A malformed tool call should become {tool:null} (and get dropped),
// not crash the frontend.
function sanitizeToolCalls(raw, ctx, message = '') {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const validCategoryKeys = new Set((ctx?.categories || []).map((c) => c.key));
  const validBusinesses = new Set((ctx?.availableBusinesses || []).map((b) => String(b).toLowerCase()));
  const explicitCaseIds = explicitCaseIdsFromMessage(message, ctx);
  const explicitBusiness = explicitBusinessFromMessage(message, ctx);
  const explicitCategoryKeys = explicitCategoryKeysFromMessage(message, ctx);
  const caseIdsForExplicitCategories = explicitCategoryKeys.length
    ? (ctx?.cases || [])
        .filter((c) => explicitCategoryKeys.includes(String(c?.category || '')))
        .map((c) => String(c.id || '').trim())
        .filter(Boolean)
    : [];

  for (const call of raw) {
    if (!call || typeof call !== 'object') continue;
    const tool = String(call.tool || '');
    const args = (call.args && typeof call.args === 'object') ? call.args : {};
    if (!ALLOWED_TOOLS.has(tool)) continue;

    switch (tool) {
      case 'createProjects': {
        if (!Array.isArray(args.projects) || !args.projects.length) continue;
        const validCaseIds = new Set((ctx?.cases || []).map((c) => String(c?.id || '')).filter(Boolean));
        const projects = [];
        for (const p of args.projects) {
          if (!p || typeof p !== 'object') continue;
          const name = String(p.name || '').trim();
          const modelBusiness = String(p.business || '').trim();
          const business = explicitBusiness || (
            valueWasExplicitlySupplied(message, modelBusiness, ['business', 'department', 'dept', '部门', '部門', '业务', '業務'])
              ? modelBusiness
              : ''
          );
          const categoryKey = String(p.categoryKey || '').trim();
          // caseIds is the "Individual pick" path — user said "用 test case 2"
          // and (ideally after clarification) we resolved to ["saptest2"].
          // When present, categoryKey can be empty.
          const caseIds = Array.isArray(p.caseIds)
            ? p.caseIds.map(String).map((s) => s.trim()).filter(Boolean)
              .filter((id) => !validCaseIds.size || validCaseIds.has(id))
              .slice(0, 50)
            : [];
          const hasCaseSignal = /\b(?:cases?|test\s*cases?|saptests?)\b|case\s*\d|用例|選|选/.test(normalizeCaseRefText(message));
          const finalCaseIds = explicitCaseIds.length
            ? explicitCaseIds
            : (caseIdsForExplicitCategories.length ? caseIdsForExplicitCategories : (hasCaseSignal ? caseIds : []));
          const finalCategoryKey = finalCaseIds.length
            ? ''
            : (categoryWasExplicitlySupplied(message, categoryKey, ctx) ? categoryKey : '');
          if (!name || !business) continue;
          if (!finalCategoryKey && !finalCaseIds.length) continue; // need one or the other
          if (finalCategoryKey && validCategoryKeys.size && !validCategoryKeys.has(finalCategoryKey)) continue;
          if (validBusinesses.size && !validBusinesses.has(String(business).toLowerCase())) continue;
          const action = ALLOWED_ACTIONS.has(p.action) ? p.action : 'save';
          const runsPerCase = Math.max(1, Math.min(10, Number(p.runsPerCase) || 1));
          const labels = Array.isArray(p.labels)
            ? p.labels.map((s) => String(s).trim()).filter(Boolean).slice(0, 8)
            : [];
          projects.push({ name, business, categoryKey: finalCategoryKey || null, caseIds: finalCaseIds, labels, runsPerCase, action });
        }
        if (projects.length) out.push({ tool, args: { projects } });
        break;
      }
      case 'runLatestProjects': {
        const count = Math.max(1, Math.min(10, Number(args.count) || 1));
        const sequentially = args.sequentially !== false; // default true
        const modelBusiness = args.business ? String(args.business).trim() : '';
        // Only accept the business filter if it maps to an enum entry and
        // the user actually mentioned a business (mirrors createProjects).
        const business = (explicitBusiness && validBusinesses.has(explicitBusiness.toLowerCase()))
          ? explicitBusiness
          : (modelBusiness
              && validBusinesses.has(modelBusiness.toLowerCase())
              && valueWasExplicitlySupplied(message, modelBusiness, ['business', 'department', 'dept', '部门', '部門', '业务', '業務'])
                ? modelBusiness
                : null);
        out.push({ tool, args: { count, sequentially, business } });
        break;
      }
      case 'openProject': {
        const kind = ALLOWED_PROJECT_KINDS.has(args.kind) ? args.kind : 'latest';
        const expandCases = args.expandCases !== false;
        // Merge the legacy kind field with the richer selector axes below.
        // Both shapes are valid; the frontend dispatcher picks the newer one
        // when any selector field is present.
        const sel = sanitizeProjectSelector(args, ctx, message);
        out.push({ tool, args: { kind, expandCases, ...sel } });
        break;
      }
      case 'runProject': {
        const sel = sanitizeProjectSelector(args, ctx, message);
        const count = Math.max(1, Math.min(10, Number(args.count) || 1));
        const runsPerCase = Math.max(1, Math.min(10, Number(args.runsPerCase) || 1));
        out.push({ tool, args: { ...sel, count, runsPerCase } });
        break;
      }
      case 'openLiveChannels':
        out.push({ tool, args: {} });
        break;
      case 'openLatestFailedReport':
        // Back-compat alias — collapse into openLatestRunReport(failed).
        out.push({ tool: 'openLatestRunReport', args: { ...sanitizeProjectSelector(args, ctx, message), status: 'failed' } });
        break;
      case 'openLatestRunReport': {
        const allowed = new Set(['passed', 'failed', 'any']);
        const status = allowed.has(args.status) ? args.status : 'any';
        const sel = sanitizeProjectSelector(args, ctx, message);
        const category = String(args.categoryKey || args.category || '').trim();
        const categoryKey = category && validCategoryKeys.has(category) && categoryWasExplicitlySupplied(message, category, ctx)
          ? category
          : (explicitCategoryKeys[0] || null);
        const search = args.search || args.query ? String(args.search || args.query).trim().slice(0, 80) : null;
        out.push({ tool, args: { status, business: sel.business, name: sel.name, categoryKey, search } });
        break;
      }
      case 'openFailureAnalytics': {
        const caseId = args.caseId ? String(args.caseId).trim() : null;
        out.push({ tool, args: { caseId } });
        break;
      }
      case 'openSection': {
        const section = String(args.section || '').trim();
        if (!ALLOWED_SECTIONS.has(section)) continue;
        out.push({ tool, args: { section } });
        break;
      }
      case 'queryEntities': {
        const entity = String(args.entity || '').trim();
        if (!ALLOWED_QUERY_ENTITIES.has(entity)) continue;
        const filter = (args.filter && typeof args.filter === 'object') ? args.filter : {};
        // Hold onto only the filter fields we know about — the frontend
        // ignores unknown keys anyway, but stripping them keeps the
        // surface tight.
        const cleanFilter = {};
        if (filter.category)  cleanFilter.category  = String(filter.category).trim();
        if (filter.business)  cleanFilter.business  = String(filter.business).trim();
        if (filter.caseId)    cleanFilter.caseId    = String(filter.caseId).trim();
        if (filter.projectId) cleanFilter.projectId = String(filter.projectId).trim();
        if (filter.search)    cleanFilter.search    = String(filter.search).trim();
        // Reject category not in the enum we sent (mirrors createProjects rule).
        if (cleanFilter.category && validCategoryKeys.size && !validCategoryKeys.has(cleanFilter.category)) {
          delete cleanFilter.category;
        }
        const sort = ALLOWED_QUERY_SORTS.has(args.sort) ? args.sort : null;
        const limit = Math.max(1, Math.min(200, Number(args.limit) || 100));
        const title = args.title ? String(args.title).trim().slice(0, 120) : null;
        out.push({ tool, args: { entity, filter: cleanFilter, sort, limit, title } });
        break;
      }
      case 'highlightProjects': {
        const names = Array.isArray(args.names)
          ? args.names.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 30)
          : [];
        if (!names.length) continue;
        const navigate = args.navigate !== false; // default true
        out.push({ tool, args: { names, navigate } });
        break;
      }
      case 'queryStats': {
        const groupBy = String(args.groupBy || '').trim();
        const countOf = String(args.countOf || '').trim();
        if (!ALLOWED_STATS_GROUP.has(groupBy)) continue;
        if (!ALLOWED_STATS_COUNT.has(countOf)) continue;
        const title = args.title ? String(args.title).trim().slice(0, 120) : null;
        out.push({ tool, args: { groupBy, countOf, title } });
        break;
      }
      default:
        // ALLOWED_TOOLS check above guards this, but be defensive.
        break;
    }
  }
  // Hard rule from the KB: never chain createProjects + runLatestProjects
  // in the same plan (createProjects already runs the ones flagged
  // action='run'). Drop the trailing runLatestProjects defensively.
  const hasCreate = out.some((c) => c.tool === 'createProjects');
  if (hasCreate) {
    return out.filter((c) => c.tool !== 'runLatestProjects');
  }
  return out;
}

router.post('/plan', async (req, res) => {
  const { message, context } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL;
  const apiKey  = process.env.MIDSCENE_MODEL_API_KEY;
  const modelName = process.env.MIDSCENE_MODEL_NAME;
  if (!baseUrl || !apiKey || !modelName) {
    return res.status(503).json({
      error: 'AI model not configured — set MIDSCENE_MODEL_BASE_URL / MIDSCENE_MODEL_API_KEY / MIDSCENE_MODEL_NAME in .env',
    });
  }

  // Trim the context down to just what the planner can actually use,
  // and cap sizes so the prompt doesn't balloon when the user has
  // hundreds of saved projects.
  const slimCtx = {
    availableBusinesses: Array.isArray(context?.availableBusinesses)
      ? context.availableBusinesses.slice(0, 50).map(String)
      : [],
    categories: Array.isArray(context?.categories)
      ? context.categories.slice(0, 30).map((c) => ({
          key: String(c?.key || ''),
          label: String(c?.label || ''),
          caseCount: Number(c?.caseCount) || 0,
        }))
      : [],
    recentProjects: Array.isArray(context?.recentProjects)
      ? context.recentProjects.slice(0, 8).map((p) => ({
          name: String(p?.name || ''),
          business: String(p?.business || ''),
          createdAt: String(p?.createdAt || ''),
        }))
      : [],
    // Cases list — id + short title + category. Enables fuzzy matching
    // ("test case 2" → saptest2) and validates caseIds against a real
    // set. Capped at 60 to keep the prompt bounded.
    cases: Array.isArray(context?.cases)
      ? context.cases.slice(0, 60).map((c) => ({
          id: String(c?.id || ''),
          title: String(c?.title || '').slice(0, 80),
          category: String(c?.category || ''),
        })).filter((c) => c.id)
      : [],
    currentSection: String(context?.currentSection || ''),
  };

  await audit(req, 'agent.plan', {
    msgChars: message.length,
    businessCount: slimCtx.availableBusinesses.length,
    recentCount: slimCtx.recentProjects.length,
    model: modelName,
  });

  // Inject context as a user-role message AHEAD of the user's request,
  // so the model treats it as authoritative facts about the page.
  const contextBlock = `当前页面上下文（你只能从这些可选值里选）：

availableBusinesses (业务/部门 enum):
${slimCtx.availableBusinesses.map((b) => `  - ${b}`).join('\n') || '  (空)'}

categories (Primary Category enum — categoryKey 必须从这里取):
${slimCtx.categories.map((c) => `  - ${c.key}  (label: ${c.label}, ${c.caseCount} 个 case)`).join('\n') || '  (空)'}

recentProjects (最近创建/更新的 project，从新到旧):
${slimCtx.recentProjects.map((p) => `  - ${p.name}  · business=${p.business}  · created=${p.createdAt}`).join('\n') || '  (空)'}

cases (库里所有 case · id / title / category — "test case 2"、"saptest2"、"case 2" 都应该匹配到 id=saptest2 这条):
${slimCtx.cases.map((c) => `  - id=${c.id}  · category=${c.category}  · ${c.title}`).join('\n') || '  (空)'}

currentSection: ${slimCtx.currentSection || '(unknown)'}`;

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
          { role: 'system', content: KB_TEXT },
          { role: 'user',   content: contextBlock },
          { role: 'user',   content: message.trim() },
        ],
        // Deterministic — we want the same prompt to map to the same
        // tool call every time so behaviour is predictable.
        temperature: 0.1,
        max_tokens: 1200,
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

  // Strip optional ```json fences the model sometimes adds despite the
  // explicit "no markdown fence" instruction in the KB.
  const stripped = reply.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch (e) {
    return res.status(502).json({
      error: 'model returned invalid JSON',
      detail: stripped.slice(0, 400),
    });
  }
  const explain = String(parsed?.explain || '').slice(0, 500);
  let toolCalls = sanitizeToolCalls(parsed?.toolCalls, slimCtx, message);
  if (!toolCalls.length) {
    toolCalls = deterministicCreateProjectsFromMessage(message, slimCtx);
  }
  // Clarification — optional. Only honour it when toolCalls is empty,
  // otherwise the frontend would have to choose between executing and
  // asking, which is confusing.
  let clarification = null;
  if (!toolCalls.length) {
    clarification = createProjectClarification(parsed?.toolCalls, toolCalls, slimCtx, message);
  }
  if (!clarification && !toolCalls.length && parsed?.clarification && typeof parsed.clarification === 'object') {
    const c = parsed.clarification;
    const question = String(c.question || '').trim().slice(0, 400);
    const kind = (c.kind === 'choice' || c.kind === 'input') ? c.kind : 'input';
    const field = String(c.field || '').trim().slice(0, 40) || null;
    const suggestions = Array.isArray(c.suggestions)
      ? c.suggestions.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
      : [];
    if (question) clarification = { question, kind, field, suggestions };
  }
  return res.json({ explain, toolCalls, clarification });
});

export default router;
