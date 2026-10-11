-- Bhatta Pro Multi-Tenant SaaS — PostgreSQL schema
-- Scope model:
--   PLATFORM = Super Admin only
--   TENANT   = Tenant/Owner + Manager/Cashier within one tenant
-- No tenant user may read/write another tenant's records.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE platform_user_status AS ENUM ('active','disabled');
CREATE TYPE platform_role AS ENUM ('SUPER_ADMIN');
CREATE TYPE tenant_status AS ENUM ('trial','active','suspended','cancelled');
CREATE TYPE membership_status AS ENUM ('active','invited','disabled');
CREATE TYPE subscription_status AS ENUM ('trialing','active','past_due','cancelled','expired');
CREATE TYPE invoice_status AS ENUM ('draft','open','paid','void','uncollectible');

CREATE TABLE platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role platform_role NOT NULL DEFAULT 'SUPER_ADMIN',
  status platform_user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status tenant_status NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role_code TEXT NOT NULL CHECK (role_code IN ('OWNER','MANAGER','CASHIER')),
  status membership_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_minor BIGINT NOT NULL DEFAULT 0 CHECK (price_minor >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'PKR',
  billing_interval TEXT NOT NULL DEFAULT 'month'
    CHECK (billing_interval IN ('month','year')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status subscription_status NOT NULL DEFAULT 'trialing',
  license_key TEXT UNIQUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'PKR',
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System-wide feature flags. Only PLATFORM scope may mutate these.
-- System-level configuration. Every row is platform-owned and can only be
-- changed by a SUPER_ADMIN through platform-scoped backend permissions.
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE global_feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional tenant-level feature state. It cannot grant a globally disabled feature.
CREATE TABLE tenant_feature_flags (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES global_feature_flags(key) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, feature_key)
);

-- Business profile and local tax are tenant-owned settings.
CREATE TABLE company_profiles (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  legal_name TEXT,
  display_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  currency CHAR(3) NOT NULL DEFAULT 'PKR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenant_tax_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  tax_name TEXT,
  tax_number TEXT,
  rate NUMERIC(8,4) NOT NULL DEFAULT 0 CHECK (rate >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant business roles. Platform roles are NOT stored here.
CREATE TABLE tenant_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL CHECK (code IN ('OWNER','MANAGER','CASHIER')),
  name TEXT NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE permissions (
  code TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('PLATFORM','TENANT')),
  description TEXT NOT NULL
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES tenant_roles(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_code)
);

-- Example business data anchor. Existing application tables can reference tenant_id
-- in the same way; every tenant-owned table must carry tenant_id.
CREATE TABLE business_records_example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES tenant_users(id),
  amount_minor BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_tenant_role ON tenant_users(tenant_id, role_code);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_subscriptions_status_end ON subscriptions(status, ends_at);
CREATE INDEX idx_billing_invoices_tenant_status ON billing_invoices(tenant_id, status);
CREATE INDEX idx_system_settings_updated_by ON system_settings(updated_by);
CREATE INDEX idx_invoices_tenant ON billing_invoices(tenant_id);
CREATE INDEX idx_tenant_flags_tenant ON tenant_feature_flags(tenant_id);
CREATE INDEX idx_business_records_tenant ON business_records_example(tenant_id);

-- Seed the permission catalog.
INSERT INTO permissions (code, scope, description) VALUES
('platform.tenants.read','PLATFORM','View and search all tenants'),
('platform.tenants.create','PLATFORM','Create a tenant'),
('platform.tenants.update','PLATFORM','Change tenant status/profile'),
('platform.tenants.delete','PLATFORM','Delete/archive a tenant'),
('platform.billing.read','PLATFORM','View all subscriptions and billing'),
('platform.billing.manage','PLATFORM','Create/change subscriptions and licenses'),
('platform.features.read','PLATFORM','View global feature flags'),
('platform.features.manage','PLATFORM','Change global feature flags'),
('platform.database.read','PLATFORM','Read master database/admin data'),
('platform.database.write','PLATFORM','Perform master database administration'),
('platform.audit.read','PLATFORM','Read platform audit logs'),
('platform.settings.read','PLATFORM','Read platform-wide settings'),
('platform.settings.manage','PLATFORM','Change platform-wide settings'),
('tenant.profile.read','TENANT','View own company profile'),
('tenant.profile.manage','TENANT','Change own company profile'),
('tenant.staff.read','TENANT','View own tenant staff'),
('tenant.staff.manage','TENANT','Create/change/disable own tenant staff'),
('tenant.tax.read','TENANT','View own local tax settings'),
('tenant.tax.manage','TENANT','Change own local tax settings'),
('tenant.roles.read','TENANT','View own business roles'),
('tenant.roles.manage','TENANT','Manage Manager/Cashier permissions'),
('tenant.data.read','TENANT','Read own business data'),
('tenant.data.create','TENANT','Create own business data'),
('tenant.data.update','TENANT','Update own business data'),
('tenant.data.delete','TENANT','Delete own business data')
ON CONFLICT (code) DO NOTHING;

-- RLS: defense-in-depth. API middleware remains mandatory.
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_records_example ENABLE ROW LEVEL SECURITY;

-- The application must set these transaction-local values after authentication:
--   SET LOCAL app.actor_type = 'PLATFORM' or 'TENANT';
--   SET LOCAL app.tenant_id = '<tenant UUID>' for tenant requests.
CREATE POLICY tenant_users_isolation ON tenant_users
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

CREATE POLICY subscriptions_isolation ON subscriptions
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

CREATE POLICY invoices_isolation ON billing_invoices
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

CREATE POLICY tenant_flags_isolation ON tenant_feature_flags
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

CREATE POLICY company_profile_isolation ON company_profiles
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

CREATE POLICY tax_isolation ON tenant_tax_settings
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

CREATE POLICY roles_isolation ON tenant_roles
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );

CREATE POLICY business_records_isolation ON business_records_example
  USING (
    current_setting('app.actor_type', true) = 'PLATFORM'
    OR (current_setting('app.actor_type', true) = 'TENANT'
        AND tenant_id::text = current_setting('app.tenant_id', true))
  );
