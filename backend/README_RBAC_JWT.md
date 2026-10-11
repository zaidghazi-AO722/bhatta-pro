# JWT RBAC Route Security

This layer adds only JWT authentication and role-based route authorization.

## Role boundaries

- **OWNER**: may manage business settings, staff, local tax, and business operations explicitly granted by permission.
- **MANAGER**: may **view operational data** through `operations.read` only.
- **CASHIER**: may access **POS routes only** (`/pos`) and cannot use owner or manager URLs.

## Tenant isolation

Every valid token carries `tenant_id`. `requireTenantMatch` compares any tenant ID supplied in the URL, query, or body against the authenticated tenant. A mismatch returns HTTP **403**.

## URL tampering

Unauthorized role/permission access and unmatched URLs under the protected router return HTTP **403 Forbidden**. Authentication failures remain HTTP 401.

## JWT requirements

Set `JWT_SECRET` to a strong secret in the server environment. The implementation validates:

- signature
- HS256 algorithm allowlist
- issuer
- audience
- expiry
- active account status
- user ID, tenant ID, and role claims

Tokens are intentionally short-lived (15 minutes).

## Mounting

```js
const rbacRoutes = require('./backend/rbac-routes');
app.use('/api', rbacRoutes);
```

Install the runtime dependencies in the backend project:

```bash
npm install express jsonwebtoken
```
