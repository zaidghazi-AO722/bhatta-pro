# Multi-Tenant SaaS Security Boundary

The uploaded application currently contains only a browser frontend (`index.html`).
This `backend/` directory adds the requested production-oriented database and
authorization design without changing the existing frontend UI.

## Two isolated dashboards

### Super Admin — PLATFORM scope
Only `actorType=PLATFORM`, role `SUPER_ADMIN` can access:
- Tenant management
- Billing / subscriptions / license management
- Global feature toggles
- Master database administration
- Platform audit logs
- Platform-wide settings

A Super Admin has no tenant-owner business role and does not use tenant endpoints.

### Tenant / Owner — TENANT scope
Only `actorType=TENANT` can access:
- Company profile
- Tenant staff management
- Local tax settings
- Tenant business roles (Manager, Cashier)
- Its own business data

Tenant requests are always bound to `req.auth.tenantId`. A tenant ID supplied
by the client is rejected when it differs from the authenticated tenant.

## Permission matrix

| Capability | Super Admin | Owner | Manager | Cashier |
|---|---:|---:|---:|---:|
| Tenant management | ✓ | — | — | — |
| Billing / license | ✓ | — | — | — |
| Global feature toggles | ✓ | — | — | — |
| Master DB administration | ✓ | — | — | — |
| Platform audit | ✓ | — | — | — |
| Company profile | — | ✓ | Read | Read |
| Staff management | — | ✓ | Read | — |
| Local tax | — | ✓ | Read | — |
| Business roles | — | ✓ | Read | — |
| Business data read | — | ✓ | ✓ | ✓ |
| Business data create | — | ✓ | ✓ | ✓ |
| Business data update | — | ✓ | ✓ | — |
| Business data delete | — | ✓ | — | — |

`—` means the permission is intentionally absent, not merely hidden in the UI.

## Database rule

Every tenant-owned table MUST contain `tenant_id` and foreign-key it to `tenants(id)`.
Every tenant query MUST filter by the authenticated `req.auth.tenantId`.
PostgreSQL Row Level Security in `schema.sql` provides defense-in-depth.

The application must set, inside the authenticated DB transaction:

    SET LOCAL app.actor_type = 'TENANT';
    SET LOCAL app.tenant_id = '<authenticated tenant UUID>';

For platform administration:

    SET LOCAL app.actor_type = 'PLATFORM';

Never accept `tenant_id` from the browser as the source of authorization.
