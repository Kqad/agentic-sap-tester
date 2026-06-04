// Mint a session JWT for the existing admin user so the verify script can
// reach the workbench without knowing the admin password. The cookie is only
// used in the headless Playwright session — no real auth state is altered.
import jwt from 'jsonwebtoken';
import { getJwtSecret, loadUsers } from '../server/auth/users.js';

const { users } = await loadUsers();
const admin = users.find(u => u.role === 'admin' && !u.disabled);
if (!admin) { console.error('No active admin'); process.exit(1); }
const token = jwt.sign(
  { sub: admin.id, role: admin.role, username: admin.username },
  await getJwtSecret(),
  { expiresIn: 600 },
);
process.stdout.write(token);
