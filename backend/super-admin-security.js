'use strict';

// Additive Super Admin security middleware/services.
// Dependencies: Node.js built-ins only. `db` must expose query(text, params).
const crypto = require('crypto');

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 10;
const buckets = new Map();

function clientIp(req) {
  // Prefer a trusted reverse-proxy value only when your proxy configuration is trusted.
  return String(req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
}

function rateLimitKey(req) {
  return `super-admin:${clientIp(req)}:${String(req.body?.username || req.body?.email || '').toLowerCase()}`;
}

function superAdminRateLimit(req, res, next) {
  const now = Date.now();
  const key = rateLimitKey(req);
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  current.count += 1;
  if (current.count > RATE_MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - current.startedAt)) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many authentication attempts. Try again later.' });
  }
  next();
}

function normalizeIp(ip) {
  return String(ip || '').replace(/^::ffff:/, '');
}

function ipv4ToInt(ip) {
  const p = normalizeIp(ip).split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return (((p[0] * 256 + p[1]) * 256 + p[2]) * 256 + p[3]) >>> 0;
}

function ipv4CidrContains(ip, cidr) {
  const [network, bitsText] = String(cidr).split('/');
  const address = ipv4ToInt(ip);
  const base = ipv4ToInt(network);
  const bits = Number(bitsText);
  if (address === null || base === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (address & mask) === (base & mask);
}

async function requireSuperAdminIpAllowlist(db) {
  return async function superAdminIpAllowlist(req, res, next) {
    if (req.auth?.actorType !== 'PLATFORM' || req.auth?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super Admin access required.' });
    }
    const ip = clientIp(req);
    const result = await db.query(
      `SELECT cidr::text AS cidr FROM super_admin_ip_allowlist WHERE enabled = TRUE`
    );
    const allowed = result.rows.some(row => ipv4CidrContains(ip, row.cidr));
    if (!allowed) {
      return res.status(403).json({ error: 'Super Admin IP address is not allowlisted.' });
    }
    next();
  };
}

function hashOtp(otp, secret) {
  return crypto.createHmac('sha256', secret).update(String(otp)).digest('hex');
}

async function createOtpChallenge(db, platformUserId, secret) {
  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const id = crypto.randomUUID();
  const hash = hashOtp(otp, secret);
  await db.query(
    `INSERT INTO super_admin_mfa_challenges
       (id, platform_user_id, otp_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, platformUserId, hash, new Date(Date.now() + OTP_TTL_MS)]
  );
  // Deliver `otp` through the application's trusted email/SMS provider; never log it.
  return { challengeId: id, otp };
}

async function verifyOtpChallenge(db, challengeId, platformUserId, otp, secret) {
  const result = await db.query(
    `SELECT id, otp_hash, expires_at, attempts, consumed_at
       FROM super_admin_mfa_challenges
      WHERE id = $1 AND platform_user_id = $2
      FOR UPDATE`,
    [challengeId, platformUserId]
  );
  const row = result.rows[0];
  if (!row || row.consumed_at || new Date(row.expires_at) <= new Date() || row.attempts >= MAX_OTP_ATTEMPTS) {
    return false;
  }
  const supplied = hashOtp(otp, secret);
  const a = Buffer.from(supplied, 'hex');
  const b = Buffer.from(row.otp_hash, 'hex');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  await db.query(
    valid
      ? `UPDATE super_admin_mfa_challenges SET consumed_at = now() WHERE id = $1`
      : `UPDATE super_admin_mfa_challenges SET attempts = attempts + 1 WHERE id = $1`,
    [challengeId]
  );
  return valid;
}

function requireMfa(req, res, next) {
  if (req.auth?.actorType !== 'PLATFORM' || req.auth?.role !== 'SUPER_ADMIN' || req.auth?.mfaVerified !== true) {
    return res.status(403).json({ error: 'Super Admin MFA verification required.' });
  }
  next();
}

function auditAdminAction(db, action, getResource = () => ({})) {
  return async function adminAuditMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = async payload => {
      try {
        const resource = getResource(req) || {};
        await db.query(
          `INSERT INTO super_admin_audit_log
             (platform_user_id, action, resource_type, resource_id, ip_address,
              user_agent, request_id, success, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            req.auth?.userId || null,
            action,
            resource.resourceType || null,
            resource.resourceId || null,
            clientIp(req) || null,
            req.get?.('user-agent') || null,
            req.get?.('x-request-id') || null,
            res.statusCode < 400,
            JSON.stringify({ statusCode: res.statusCode })
          ]
        );
      } catch (_) {
        // Do not expose audit storage internals to clients.
      }
      return originalJson(payload);
    };
    next();
  };
}

module.exports = {
  superAdminRateLimit,
  requireSuperAdminIpAllowlist,
  createOtpChallenge,
  verifyOtpChallenge,
  requireMfa,
  auditAdminAction
};
