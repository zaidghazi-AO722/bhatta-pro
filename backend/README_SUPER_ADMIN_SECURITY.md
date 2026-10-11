# Super Admin Security Add-On

This is an additive security layer only. Existing tenant isolation, sidebar/UI, permissions, and application files are unchanged.

## 1. IP Whitelisting

Store approved networks in `super_admin_ip_allowlist`. Every Super Admin route should run the IP middleware after authentication and before the administrative handler.

```js
app.use('/api/super-admin', requireAuth, ipAllowlist(db), requireMfa);
```

Only enabled CIDRs are accepted. Keep the reverse-proxy trust configuration correct so `req.ip` cannot be spoofed.

## 2. OTP MFA

`createOtpChallenge()` creates a random six-digit OTP, stores only an HMAC hash, and expires it after five minutes. `verifyOtpChallenge()` uses constant-time comparison, limits attempts to five, and consumes a successful challenge.

The OTP itself must be delivered by the application's trusted email/SMS provider and must never be logged. After successful verification, the authentication/session layer should set `mfaVerified: true` for the short-lived Super Admin session.

## 3. Rate Limiting

`superAdminRateLimit` limits Super Admin authentication attempts per IP + username/email. The example uses 10 attempts per 15 minutes. For a multi-instance production deployment, replace the in-memory bucket with Redis or another shared rate-limit store.

## 4. Audit Logging

`super_admin_audit_log` records the Super Admin actor, action, resource, IP, user-agent, request ID, success state, and metadata. `auditAdminAction()` wraps administrative routes so successful and failed responses can be recorded.

Audit records should be append-only for the application role. Do not expose update/delete endpoints for audit rows.

## Recommended middleware order

1. Authentication
2. IP allowlist
3. Rate limiting on authentication/OTP endpoints
4. Super Admin role/permission check
5. MFA verification
6. Administrative handler
7. Audit logging

Do not treat any frontend control as a security boundary.
