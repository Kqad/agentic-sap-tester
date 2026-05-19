// Append-only audit log. One JSON object per line in server/data/audit.jsonl.
// Best-effort writes — failures are logged but don't break the request.

import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './paths.js';

const DATA_DIR = path.join(ROOT, 'server', 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.jsonl');

export async function audit(req, action, details = {}) {
  const entry = {
    ts: new Date().toISOString(),
    action,
    user: req?.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null,
    ip: req?.ip || req?.socket?.remoteAddress || null,
    ua: req?.get?.('user-agent') || null,
    ...details,
  };
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.appendFile(AUDIT_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[audit] write failed:', e.message);
  }
}

export async function readAudit({ limit = 200 } = {}) {
  try {
    const raw = await fs.readFile(AUDIT_FILE, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    const tail = lines.slice(-limit).reverse();
    return tail.map(l => { try { return JSON.parse(l); } catch { return { raw: l }; } });
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}
