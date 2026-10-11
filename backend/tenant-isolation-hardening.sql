-- Defense-in-depth hardening for strict tenant isolation.
-- Run after schema.sql.

-- FORCE RLS means even table owners are subject to RLS policies unless a
-- deliberately privileged database role bypasses RLS.
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_flags FORCE ROW LEVEL SECURITY;
ALTER TABLE company_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_tax_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE business_records_example FORCE ROW LEVEL SECURITY;

-- Existing USING policies protect reads/deletes. WITH CHECK additionally
-- prevents a tenant from inserting/updating a row under another tenant_id.
DROP POLICY IF EXISTS tenant_users_isolation ON tenant_users;
CREATE POLICY tenant_users_isolation ON tenant_users
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS subscriptions_isolation ON subscriptions;
CREATE POLICY subscriptions_isolation ON subscriptions
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS invoices_isolation ON billing_invoices;
CREATE POLICY invoices_isolation ON billing_invoices
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS tenant_flags_isolation ON tenant_feature_flags;
CREATE POLICY tenant_flags_isolation ON tenant_feature_flags
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS company_profile_isolation ON company_profiles;
CREATE POLICY company_profile_isolation ON company_profiles
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS tax_isolation ON tenant_tax_settings;
CREATE POLICY tax_isolation ON tenant_tax_settings
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS roles_isolation ON tenant_roles;
CREATE POLICY roles_isolation ON tenant_roles
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS business_records_isolation ON business_records_example;
CREATE POLICY business_records_isolation ON business_records_example
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );
