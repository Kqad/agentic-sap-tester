// /api/users — admin-only user management.

import express from 'express';
import {
  loadUsers, createUser, updateUser, deleteUser, publicUser, findUserById,
} from '../auth/users.js';
import { ROLES } from '../auth/rbac.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { audit } from '../audit.js';

const router = express.Router();
router.use(requireAuth(), requirePermission('users:manage'));

router.get('/', async (_req, res) => {
  const { users } = await loadUsers();
  res.json({
    users: users.map(publicUser).sort((a, b) => a.username.localeCompare(b.username)),
    roles: ROLES,
  });
});

router.post('/', async (req, res) => {
  const { username, password, displayName, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
  if (String(password).length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
  try {
    const user = await createUser({ username, password, displayName, role: role || 'viewer' });
    await audit(req, 'users.create', { id: user.id, username: user.username, role: user.role });
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const target = await findUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'user not found' });
  const { displayName, role, disabled, password } = req.body || {};

  // Safety: prevent the last admin from being demoted / disabled / deleted.
  const { users } = await loadUsers();
  const admins = users.filter(u => u.role === 'admin' && !u.disabled);
  const targetIsLastAdmin = target.role === 'admin' && admins.length === 1 && admins[0].id === target.id;
  if (targetIsLastAdmin && (role && role !== 'admin')) {
    return res.status(400).json({ error: 'cannot demote the last active admin' });
  }
  if (targetIsLastAdmin && disabled === true) {
    return res.status(400).json({ error: 'cannot disable the last active admin' });
  }
  if (password !== undefined && String(password).length > 0 && String(password).length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  try {
    const patch = {};
    if (displayName !== undefined) patch.displayName = displayName;
    if (role !== undefined) patch.role = role;
    if (disabled !== undefined) patch.disabled = disabled;
    if (password) patch.password = password;
    const updated = await updateUser(target.id, patch);
    await audit(req, 'users.update', { id: target.id, fields: Object.keys(patch) });
    res.json({ user: publicUser(updated) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  const target = await findUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'user not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'cannot delete yourself' });
  const { users } = await loadUsers();
  if (target.role === 'admin') {
    const admins = users.filter(u => u.role === 'admin' && !u.disabled);
    if (admins.length === 1 && admins[0].id === target.id) {
      return res.status(400).json({ error: 'cannot delete the last active admin' });
    }
  }
  await deleteUser(target.id);
  await audit(req, 'users.delete', { id: target.id, username: target.username });
  res.json({ ok: true });
});

export default router;
