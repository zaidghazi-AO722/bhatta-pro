# Requested change only

Added strict `tenant_id` multi-tenancy registration and isolation logic:
- Fresh tenant registration transaction.
- New Owner bound to the new tenant_id.
- No business transaction data copied into a new tenant.
- Tenant-scoped query examples.
- RLS hardening with FORCE RLS and WITH CHECK.
- Tenant isolation implementation notes.

Existing frontend/sidebar files and existing database schema were not redesigned.
