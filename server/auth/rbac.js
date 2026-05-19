// Role-based access control. A user has exactly one role; each role expands
// to a set of permissions. Permissions are checked in route guards.
//
// Permission naming: <resource>:<action>. Use "*" as a wildcard ONLY in the
// admin role definition — route guards expect exact permissions otherwise.

export const PERMISSIONS = [
  'cases:read',
  'cases:write',
  'cases:delete',
  'config:read',
  'config:write',
  'results:read',
  'runs:execute',
  'runs:stop',
  'agent:use',
  'users:manage',
  'audit:read',
];

export const ROLES = {
  admin: {
    label: 'Administrator',
    description: '完全控制：用户/配置/用例/运行/审计',
    permissions: ['*'],
  },
  editor: {
    label: 'Editor',
    description: '编辑用例、运行测试、调用 AI 生成器；只读配置',
    permissions: [
      'cases:read', 'cases:write', 'cases:delete',
      'config:read',
      'results:read',
      'runs:execute', 'runs:stop',
      'agent:use',
    ],
  },
  runner: {
    label: 'Runner',
    description: '执行测试、查看结果；不能编辑',
    permissions: [
      'cases:read',
      'config:read',
      'results:read',
      'runs:execute', 'runs:stop',
    ],
  },
  viewer: {
    label: 'Viewer',
    description: '只读：用例、配置、结果',
    permissions: ['cases:read', 'config:read', 'results:read'],
  },
};

export function permissionsFor(role) {
  const def = ROLES[role];
  if (!def) return [];
  if (def.permissions.includes('*')) return [...PERMISSIONS];
  return [...def.permissions];
}

export function hasPermission(user, perm) {
  if (!user || !user.role) return false;
  const perms = permissionsFor(user.role);
  return perms.includes(perm);
}
