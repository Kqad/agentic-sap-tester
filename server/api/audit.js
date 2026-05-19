// /api/audit — read-only view of the audit log. Anyone with audit:read can see.

import express from 'express';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { readAudit } from '../audit.js';

const router = express.Router();
router.use(requireAuth(), requirePermission('audit:read'));

router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000);
  const entries = await readAudit({ limit });
  res.json({ entries, limit });
});

export default router;
