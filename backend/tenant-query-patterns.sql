-- Multi-tenant query patterns.
-- Every tenant-owned table MUST contain tenant_id and every query MUST bind it
-- from authenticated server context, never from an untrusted client value.

-- 1) Establish tenant context for the current transaction.
BEGIN;
SELECT set_config('app.actor_type', 'TENANT', true);
SELECT set_config('app.tenant_id', $1::text, true); -- $1 = req.auth.tenantId

-- 2) Safe query: the tenant_id comes from authenticated context.
SELECT *
FROM business_records_example
WHERE tenant_id = current_setting('app.tenant_id')::uuid
ORDER BY created_at DESC;

-- 3) Safe write pattern: explicitly use the authenticated tenant_id.
INSERT INTO business_records_example (tenant_id, created_by, amount_minor)
VALUES (
  current_setting('app.tenant_id')::uuid,
  $2::uuid, -- authenticated req.auth.userId
  $3::bigint
);

COMMIT;

-- 4) Cross-tenant IDs must never be accepted as authority.
-- WRONG: SELECT * FROM business_records_example WHERE tenant_id = $clientTenantId;
-- RIGHT: SELECT * FROM business_records_example
--        WHERE tenant_id = current_setting('app.tenant_id')::uuid;

-- 5) For a lookup by record ID, keep tenant_id in the predicate too.
SELECT *
FROM business_records_example
WHERE id = $4::uuid
  AND tenant_id = current_setting('app.tenant_id')::uuid;
