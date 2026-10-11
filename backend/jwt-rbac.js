'use strict';

const jwt = require('jsonwebtoken');

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = process.env.JWT_ISSUER || 'bhatta-management-system';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'tenant-users';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail closed in production rather than accepting an unsigned/default token secret.
  throw new Error('JWT_SECRET must be configured.');
}

const ROLE_PERMISSIONS = Object.freeze({
  OWNER: new Set([
    'business.settings.read',
    'business.settings.manage',
    'staff.read',
    'staff.manage',
    'tax.read',
    'tax.manage',
    'operations.read',
    'operations.manage',
    'pos.read',
    'pos.transact'
  ]),
  MANAGER: new Set([
    'operations.read'
  ]),
  CASHIER: new Set([
    'pos.read',
    'pos.transact'
  ])
});

function authenticateJWT(req, res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(match[1], JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    if (!payload.sub || !payload.tenant_id || !payload.role || !ROLE_PERMISSIONS[payload.role]) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    req.auth = {
      userId: payload.sub,
      tenantId: payload.tenant_id,
      role: payload.role,
      status: payload.status || 'active'
    };

    if (req.auth.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  return (req, res, next) => {
    if (!req.auth || !allowed.has(req.auth.role)) {
      return res.status(403).json({ error: 'Forbidden: role is not authorized for this URL.' });
    }
    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = ROLE_PERMISSIONS[req.auth?.role];
    if (!permissions || !permissions.has(permission)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permission for this URL.' });
    }
    next();
  };
}

function requireTenantMatch(req, res, next) {
  const requestedTenantId = req.params.tenantId || req.body?.tenantId || req.query?.tenantId;
  if (requestedTenantId && requestedTenantId !== req.auth.tenantId) {
    return res.status(403).json({ error: 'Forbidden: cross-tenant access denied.' });
  }
  req.tenantId = req.auth.tenantId;
  next();
}

function issueAccessToken(user) {
  return jwt.sign(
    {
      tenant_id: user.tenantId,
      role: user.role,
      status: user.status || 'active'
    },
    JWT_SECRET,
    {
      subject: String(user.id),
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: '15m'
    }
  );
}

module.exports = {
  ROLE_PERMISSIONS,
  authenticateJWT,
  requireRole,
  requirePermission,
  requireTenantMatch,
  issueAccessToken
};
