// Express-style authorization middleware.
// Authentication must populate req.auth with:
// PLATFORM: { actorType:'PLATFORM', role:'SUPER_ADMIN', status:'active', userId }
// TENANT:   { actorType:'TENANT', role:'OWNER|MANAGER|CASHIER', tenantId, status:'active', userId }

const { hasPermission } = require('./permissions');

function requireAuth(req, res, next) {
  if (!req.auth || req.auth.status !== 'active') {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

function requirePlatform(permission) {
  return [
    requireAuth,
    (req, res, next) => {
      const a = req.auth;
      if (a.actorType !== 'PLATFORM' || a.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Platform administration access denied.' });
      }
      if (!hasPermission(a, permission)) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      next();
    }
  ];
}

function requireTenant(permission) {
  return [
    requireAuth,
    (req, res, next) => {
      const a = req.auth;

      // Hard boundary: platform actors cannot use tenant-owner endpoints.
      if (a.actorType !== 'TENANT') {
        return res.status(403).json({ error: 'Tenant dashboard access denied.' });
      }

      if (!a.tenantId) {
        return res.status(403).json({ error: 'Tenant context is required.' });
      }

      if (!hasPermission(a, permission)) {
        return res.status(403).json({ error: 'Permission denied.' });
      }

      // If a tenantId appears in URL/body/query, it MUST equal the authenticated tenant.
      const requestedTenantId =
        req.params.tenantId || req.body?.tenantId || req.query?.tenantId;

      if (requestedTenantId && requestedTenantId !== a.tenantId) {
        return res.status(403).json({ error: 'Cross-tenant access denied.' });
      }

      // Route handlers should use req.auth.tenantId for database filters.
      req.tenantId = a.tenantId;
      next();
    }
  ];
}

// Use this for tenant resources even when the endpoint has no tenantId parameter.
// It prevents accidental cross-tenant queries by requiring handlers to use req.tenantId.
function tenantContext(req, res, next) {
  if (req.auth?.actorType !== 'TENANT' || !req.auth.tenantId) {
    return res.status(403).json({ error: 'Valid tenant context required.' });
  }
  req.tenantId = req.auth.tenantId;
  next();
}

module.exports = { requireAuth, requirePlatform, requireTenant, tenantContext };
