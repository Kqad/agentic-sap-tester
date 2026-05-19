// User store backed by JSON file. Single-process write safety only — fine for
// this internal tool's scale. Passwords are bcrypt hashes; we never store or
// log the plaintext.

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ROOT } from '../paths.js';
import { ROLES } from './rbac.js';

const DATA_DIR  = path.join(ROOT, 'server', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET_FILE = path.join(DATA_DIR, 'jwt.secret');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return fallback;
    throw e;
  }
}

async function writeJson(file, value) {
  await ensureDataDir();
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

export async function loadUsers() {
  return await readJson(USERS_FILE, { users: [] });
}

export async function saveUsers(state) {
  await writeJson(USERS_FILE, state);
}

export async function getJwtSecret() {
  await ensureDataDir();
  try {
    return (await fs.readFile(SECRET_FILE, 'utf8')).trim();
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const secret = crypto.randomBytes(48).toString('hex');
  await fs.writeFile(SECRET_FILE, secret, 'utf8');
  return secret;
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName || u.username,
    role: u.role,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || null,
    disabled: !!u.disabled,
  };
}

export async function findUserByUsername(username) {
  const { users } = await loadUsers();
  return users.find(u => u.username.toLowerCase() === String(username || '').toLowerCase()) || null;
}

export async function findUserById(id) {
  const { users } = await loadUsers();
  return users.find(u => u.id === id) || null;
}

export async function verifyCredentials(username, password) {
  const u = await findUserByUsername(username);
  if (!u || u.disabled) return null;
  const ok = await bcrypt.compare(String(password || ''), u.passwordHash || '');
  return ok ? u : null;
}

export async function setLastLogin(userId) {
  const state = await loadUsers();
  const u = state.users.find(x => x.id === userId);
  if (!u) return;
  u.lastLoginAt = new Date().toISOString();
  await saveUsers(state);
}

export async function createUser({ username, password, displayName, role }) {
  if (!username || !password) throw new Error('username and password are required');
  if (!ROLES[role]) throw new Error(`unknown role: ${role}`);
  const state = await loadUsers();
  if (state.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('username already exists');
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    username,
    displayName: displayName || username,
    role,
    passwordHash,
    createdAt: now,
    lastLoginAt: null,
    disabled: false,
  };
  state.users.push(user);
  await saveUsers(state);
  return user;
}

export async function updateUser(id, patch) {
  const state = await loadUsers();
  const u = state.users.find(x => x.id === id);
  if (!u) throw new Error('user not found');
  if (patch.displayName !== undefined) u.displayName = patch.displayName;
  if (patch.role !== undefined) {
    if (!ROLES[patch.role]) throw new Error(`unknown role: ${patch.role}`);
    u.role = patch.role;
  }
  if (patch.disabled !== undefined) u.disabled = !!patch.disabled;
  if (patch.password) u.passwordHash = await bcrypt.hash(String(patch.password), 10);
  await saveUsers(state);
  return u;
}

export async function deleteUser(id) {
  const state = await loadUsers();
  const before = state.users.length;
  state.users = state.users.filter(u => u.id !== id);
  if (state.users.length === before) throw new Error('user not found');
  await saveUsers(state);
}

// First-run bootstrap: if no users exist, create an admin. Password comes from
// ADMIN_PASSWORD env var, else a random one printed to console (one-time only).
export async function bootstrapAdminIfNeeded() {
  const { users } = await loadUsers();
  if (users.length > 0) return null;
  const username = process.env.ADMIN_USERNAME || 'admin';
  let password = process.env.ADMIN_PASSWORD || '';
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
    generated = true;
  }
  const user = await createUser({
    username,
    password,
    displayName: 'Administrator',
    role: 'admin',
  });
  return { user, password, generated };
}
