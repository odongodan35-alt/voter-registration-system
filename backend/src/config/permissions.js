// Central permission map - single source of truth for role-based access.
// To grant/revoke access, edit this file only.

export const ROLES = Object.freeze({
  ADMINISTRATOR: 'ADMINISTRATOR',
  REGISTRATION_OFFICER: 'REGISTRATION_OFFICER',
  VIEWER: 'VIEWER'
});

export const PERMISSIONS = Object.freeze({
  // User management
  'users:list':     ['ADMINISTRATOR'],
  'users:create':   ['ADMINISTRATOR'],
  'users:update':   ['ADMINISTRATOR'],
  'users:status':   ['ADMINISTRATOR'],
  'users:password': ['ADMINISTRATOR'],
  'users:delete':   ['ADMINISTRATOR'],

  // Voter records
  'voters:read':    ['ADMINISTRATOR', 'REGISTRATION_OFFICER', 'VIEWER'],
  'voters:create':  ['ADMINISTRATOR', 'REGISTRATION_OFFICER'],
  'voters:update':  ['ADMINISTRATOR', 'REGISTRATION_OFFICER'],
  'voters:archive': ['ADMINISTRATOR', 'REGISTRATION_OFFICER'],

  // Reports & audit
  'reports:read':   ['ADMINISTRATOR', 'REGISTRATION_OFFICER'],
  'audit:read':     ['ADMINISTRATOR'],

  // Elections management (admin-only)
  'elections:read':   ['ADMINISTRATOR'],
  'elections:manage': ['ADMINISTRATOR'],
  'positions:read':   ['ADMINISTRATOR'],
  'positions:manage': ['ADMINISTRATOR'],
  'candidates:read':  ['ADMINISTRATOR'],
  'candidates:manage':['ADMINISTRATOR'],
  'votes:stats':      ['ADMINISTRATOR']
});

export const roleHas = (role, permission) => {
  const allowed = PERMISSIONS[permission];
  return Array.isArray(allowed) && allowed.includes(role);
};