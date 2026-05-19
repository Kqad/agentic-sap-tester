// Auth middleware. Reads JWT from the "saptest_session" httpOnly cookie,
// verifies it, attaches the (fresh) user record to req.user, and rejects
// requests that fail auth/permission checks.

import jwt from 'jsonwebtoken';
import { findUserById, getJwtSecret, publicUser } from './users.js';
import { hasPermission } from './rbac.js';

export const COOKIE_NAME = 'saptest_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8h

let cachedSecret = null;
export async function secret() {
  if (!cachedSecret) cachedSecret = await getJwtSecret();
  return cachedSecret;
}

export async function signSession(user) {
  const payload = { sub: user.id, role: user.role, username: user.username };
  return jwt.sign(payload, await secret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set to true once served over HTTPS
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export async function tryAuth(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  let decoded;
  try {
    decoded = jwt.verify(token, await secret());
  } catch {
    return null;
  }
  const user = await findUserById(decoded.sub);
  if (!user || user.disabled) return null;
  return user;
}

export function requireAuth() {
  return async (req, res, next) => {
    const user = await tryAuth(req);
    if (!user) return res.status(401).json({ error: 'unauthenticated' });
    req.user = user;
    next();
  };
}

export function requirePermission(perm) {
  return async (req, res, next) => {
    if (!req.user) {
      const user = await tryAuth(req);
      if (!user) return res.status(401).json({ error: 'unauthenticated' });
      req.user = user;
    }
    if (!hasPermission(req.user, perm)) {
      return res.status(403).json({ error: 'forbidden', need: perm });
    }
    next();
  };
}

export function attachUser() {
  // Best-effort: populate req.user if a valid cookie is present, but never reject.
  return async (req, _res, next) => {
    if (!req.user) {
      const user = await tryAuth(req);
      if (user) req.user = user;
    }
    next();
  };
}

export { publicUser };
