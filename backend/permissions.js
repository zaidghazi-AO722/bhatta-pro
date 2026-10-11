// Multi-Tenant SaaS permission matrix.
// This file is intentionally backend-only. Do not use UI checks as the security boundary.

const PLATFORM_PERMISSIONS = Object.freeze([
  'platform.tenants.read','platform.tenants.create','platform.tenants.update',
  'platform.tenants.delete','platform.billing.read','platform.billing.manage',
  'platform.features.read','platform.features.manage','platform.database.read',
  'platform.database.write','platform.audit.read','platform.settings.manage'
]);

const TENANT_PERMISSIONS = Object.freeze([
  'tenant.profile.read','tenant.profile.manage','tenant.staff.read','tenant.staff.manage',
  'tenant.tax.read','tenant.tax.manage','tenant.roles.read','tenant.roles.manage',
  'tenant.data.read','tenant.data.create','tenant.data.update','tenant.data.delete'
]);

// Explicit matrix: no role inherits permissions from the other security boundary.
const ROLE_PERMISSIONS = Object.freeze({
  SUPER_ADMIN: new Set(PLATFORM_PERMISSIONS),
  OWNER: new Set([
    'tenant.profile.read','tenant.profile.manage',
    'tenant.staff.read','tenant.staff.manage',
    'tenant.tax.read','tenant.tax.manage',
    'tenant.roles.read','tenant.roles.manage',
    'tenant.data.read','tenant.data.create','tenant.data.update','tenant.data.delete'
  ]),
  MANAGER: new Set([
    'tenant.profile.read',
    'tenant.staff.read',
    'tenant.tax.read',
    'tenant.roles.read',
    'tenant.data.read','tenant.data.create','tenant.data.update'
  ]),
  CASHIER: new Set([
    'tenant.profile.read',
    'tenant.data.read','tenant.data.create'
  ])
});

function hasPermission(actor, permission) {
  if (!actor || actor.status !== 'active') return false;

  // Scope is part of the authorization decision, not just the role name.
  if (actor.actorType === 'PLATFORM') {
    return actor.role === 'SUPER_ADMIN' && ROLE_PERMISSIONS.SUPER_ADMIN.has(permission);
  }

  if (actor.actorType === 'TENANT') {
    if (!actor.tenantId) return false;
    const rolePerms = ROLE_PERMISSIONS[actor.role];
    return !!rolePerms && TENANT_PERMISSIONS.includes(permission) && rolePerms.has(permission);
  }

  return false;
}

module.exports = {
  PLATFORM_PERMISSIONS,
  TENANT_PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
};
