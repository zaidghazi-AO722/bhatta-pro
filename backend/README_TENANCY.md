# Strict Multi-Tenant Isolation

## Tenant boundary
Every tenant-owned business table must contain a non-null `tenant_id` foreign key to `tenants(id)` and an index beginning with `tenant_id`.

The server derives `tenant_id` exclusively from the authenticated user's membership (`req.auth.tenantId`). A browser/client-supplied tenant ID is never trusted.

## Fresh Business Owner registration
`tenant-registration.js` creates a new UUID tenant, creates exactly one OWNER membership for that tenant, initializes only that tenant's configuration, and creates no business transactions. Sales, purchases, labour, stock, cash book, daily book, khata, invoices, and other business data therefore begin at zero.

The registration is one database transaction. If any step fails, the entire new tenant is rolled back.

## Query isolation
`tenant-query-patterns.sql` shows the required query pattern. Tenant queries use `current_setting('app.tenant_id')`, which is set from the authenticated server context. Never use a tenant ID supplied by request body/query parameters as the security authority.

## Database defense
`tenant-isolation-hardening.sql` enables `FORCE ROW LEVEL SECURITY` and adds `WITH CHECK` to prevent inserts/updates from changing a row's tenant ownership. Middleware remains the first authorization boundary; RLS is defense-in-depth.

## Applying to the real business tables
For each existing tenant-owned table (sales, purchases, labour khata, stock, cash book, daily book, khata, etc.):
1. Add `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
2. Backfill it only from a trusted relationship before making it NOT NULL.
3. Add an index such as `(tenant_id, created_at)` or `(tenant_id, status)` according to query patterns.
4. Add an RLS policy using `app.tenant_id` with both `USING` and `WITH CHECK`.
5. Update every repository/service query to constrain by the authenticated `req.auth.tenantId`.
