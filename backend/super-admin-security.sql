-- Super Admin security layer. This file is additive; it does not alter tenant tables.

CREATE TABLE IF NOT EXISTS super_admin_ip_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidr CIDR NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS super_admin_mfa_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS super_admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  platform_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sa_ip_allowlist_enabled ON super_admin_ip_allowlist(enabled);
CREATE INDEX IF NOT EXISTS idx_sa_mfa_user_expiry ON super_admin_mfa_challenges(platform_user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_sa_audit_created ON super_admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_audit_actor ON super_admin_audit_log(platform_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_audit_action ON super_admin_audit_log(action, created_at DESC);

-- Audit rows are append-only for the application role. Grant INSERT/SELECT, not UPDATE/DELETE.
-- Adjust the role name to your deployment role before applying grants.
-- REVOKE UPDATE, DELETE ON super_admin_audit_log FROM app_role;
