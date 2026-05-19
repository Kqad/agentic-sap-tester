// /api/auth/* — login, logout, me, change-password.

import express from 'express';
import {
  verifyCredentials, setLastLogin, publicUser, findUserById, updateUser,
} from './users.js';
import {
  signSession, setSessionCookie, clearSessionCookie, requireAuth, tryAuth,
} from './middleware.js';
import { permissionsFor, ROLES } from './rbac.js';
import { audit } from '../audit.js';

const router = express.Router();

// Crude in-memory rate limiter for /login — caps repeated guesses against a
// single username from a single IP. Resets after 15 min of inactivity.
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const FAIL_MAX = 8;
const failures = new Map();
function failKey(req, username) {
  return `${req.ip || 'unknown'}::${String(username || '').toLowerCase()}`;
}
function recordFailure(key) {
  const now = Date.now();
  const rec = failures.get(key) || { count: 0, firstAt: now };
  if (now - rec.firstAt > FAIL_WINDOW_MS) { rec.count = 0; rec.firstAt = now; }
  rec.count += 1;
  failures.set(key, rec);
  return rec;
}
function clearFailure(key) { failures.delete(key); }
function isBlocked(key) {
  const rec = failures.get(key);
  if (!rec) return false;
  if (Date.now() - rec.firstAt > FAIL_WINDOW_MS) { failures.delete(key); return false; }
  return rec.count >= FAIL_MAX;
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  const key = failKey(req, username);
  if (isBlocked(key)) {
    await audit(req, 'auth.login.blocked', { username });
    return res.status(429).json({ error: 'too many attempts, try again later' });
  }
  const user = await verifyCredentials(username, password);
  if (!user) {
    recordFailure(key);
    await audit(req, 'auth.login.failed', { username });
    return res.status(401).json({ error: 'invalid credentials' });
  }
  clearFailure(key);
  await setLastLogin(user.id);
  const token = await signSession(user);
  setSessionCookie(res, token);
  await audit(req, 'auth.login.success', { username: user.username });
  res.json({
    user: publicUser(user),
    permissions: permissionsFor(user.role),
  });
});

router.post('/logout', async (req, res) => {
  const user = await tryAuth(req);
  clearSessionCookie(res);
  if (user) await audit({ ...req, user }, 'auth.logout', {});
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const user = await tryAuth(req);
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  res.json({
    user: publicUser(user),
    permissions: permissionsFor(user.role),
    roles: ROLES,
  });
});

router.post('/change-password', requireAuth(), async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'new password must be at least 8 characters' });
  }
  const fresh = await findUserById(req.user.id);
  const ok = await verifyCredentials(fresh.username, currentPassword);
  if (!ok) {
    await audit(req, 'auth.change_password.failed', {});
    return res.status(401).json({ error: 'current password is incorrect' });
  }
  await updateUser(req.user.id, { password: newPassword });
  await audit(req, 'auth.change_password.success', {});
  res.json({ ok: true });
});

export default router;
