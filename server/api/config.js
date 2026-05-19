// /api/config — read/update .env variables and read playwright.config.ts.
// The MIDSCENE_MODEL_API_KEY is never returned in cleartext; instead the
// response includes hasValue + maskedSuffix (last 4 chars).

import express from 'express';
import fs from 'node:fs/promises';
import { ENV_FILE, PW_CONFIG } from '../paths.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';

const router = express.Router();
router.use(requireAuth());

const SECRET_KEYS = new Set(['MIDSCENE_MODEL_API_KEY', 'ADMIN_PASSWORD']);

// Visible env keys with descriptions for the UI form.
const KNOWN_KEYS = [
  {
    key: 'MIDSCENE_MODEL_BASE_URL',
    label: 'AI Model Base URL',
    placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    help: 'OpenAI-compatible chat-completions endpoint for the Midscene VLM.',
  },
  {
    key: 'MIDSCENE_MODEL_API_KEY',
    label: 'AI Model API Key',
    secret: true,
    placeholder: 'sk-...',
    help: 'Bearer token for the model provider. Stored in .env; never returned to the UI.',
  },
  {
    key: 'MIDSCENE_MODEL_NAME',
    label: 'AI Model Name',
    placeholder: 'qwen3.6-plus',
    help: 'Model identifier sent in chat-completion requests.',
  },
  {
    key: 'MIDSCENE_MODEL_FAMILY',
    label: 'AI Model Family',
    placeholder: 'qwen3.6',
    help: 'Tells Midscene which prompt adapter to use (qwen / gemini / openai).',
  },
  {
    key: 'HTTPS_PROXY',
    label: 'HTTPS Proxy',
    placeholder: 'http://localhost:3128',
    help: 'Corporate proxy. Used by playwright + model calls.',
  },
];

function parseDotEnv(text) {
  const out = {};
  const lines = String(text || '').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function serializeDotEnv(envObj, sourceText) {
  // Preserve existing line order and comments; update changed values in-place;
  // append truly-new keys to the end.
  const lines = String(sourceText || '').split(/\r?\n/);
  const seen = new Set();
  const out = lines.map((raw) => {
    const m = raw.match(/^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)(.*)$/);
    if (!m) return raw;
    const key = m[2];
    if (!(key in envObj)) return raw; // not managed; leave alone
    seen.add(key);
    const v = envObj[key];
    return `${m[1]}${key}=${quoteIfNeeded(v)}`;
  });
  for (const k of Object.keys(envObj)) {
    if (!seen.has(k)) out.push(`${k}=${quoteIfNeeded(envObj[k])}`);
  }
  return out.join('\n');
}

function quoteIfNeeded(v) {
  const s = String(v ?? '');
  if (/[\s#"']/.test(s)) return `"${s.replace(/"/g, '\\"')}"`;
  return s;
}

function maskValue(key, value) {
  if (!value) return { hasValue: false, maskedSuffix: null };
  if (SECRET_KEYS.has(key)) {
    const tail = String(value).slice(-4);
    return { hasValue: true, maskedSuffix: tail };
  }
  return { hasValue: true, maskedSuffix: null };
}

router.get('/', requirePermission('config:read'), async (_req, res) => {
  let text = '';
  try { text = await fs.readFile(ENV_FILE, 'utf8'); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const parsed = parseDotEnv(text);
  const keys = KNOWN_KEYS.map(meta => {
    const value = parsed[meta.key] ?? '';
    return {
      ...meta,
      ...maskValue(meta.key, value),
      value: meta.secret ? undefined : value,
    };
  });
  // also surface unknown keys so admins can see what else is in .env
  const knownSet = new Set(KNOWN_KEYS.map(k => k.key));
  const extras = Object.keys(parsed)
    .filter(k => !knownSet.has(k))
    .map(k => {
      const isSecret = /TOKEN|KEY|SECRET|PASSWORD/i.test(k);
      return {
        key: k,
        label: k,
        secret: isSecret,
        ...maskValue(isSecret ? 'MIDSCENE_MODEL_API_KEY' : k, parsed[k]),
        value: isSecret ? undefined : parsed[k],
      };
    });
  res.json({ keys: [...keys, ...extras] });
});

router.put('/', requirePermission('config:write'), async (req, res) => {
  const updates = req.body && typeof req.body === 'object' ? req.body : null;
  if (!updates) return res.status(400).json({ error: 'body must be a JSON object of key->value' });
  let text = '';
  try { text = await fs.readFile(ENV_FILE, 'utf8'); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const current = parseDotEnv(text);
  const next = { ...current };
  const changed = [];
  for (const [k, v] of Object.entries(updates)) {
    if (typeof v !== 'string') continue;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
    if (v === '' && SECRET_KEYS.has(k)) continue; // empty secret = no change
    if (current[k] !== v) {
      next[k] = v;
      changed.push(k);
    }
  }
  const serialized = serializeDotEnv(next, text);
  await fs.writeFile(ENV_FILE, serialized, 'utf8');
  await audit(req, 'config.update', { keys: changed });
  res.json({ ok: true, changed, note: 'Restart the server for new env values to take effect.' });
});

router.get('/playwright', requirePermission('config:read'), async (_req, res) => {
  try {
    const text = await fs.readFile(PW_CONFIG, 'utf8');
    res.json({ path: 'playwright.config.ts', text });
  } catch (e) {
    if (e.code === 'ENOENT') return res.json({ path: 'playwright.config.ts', text: null });
    res.status(500).json({ error: e.message });
  }
});

export default router;
