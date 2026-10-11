'use strict';

const express = require('express');
const {
  authenticateJWT,
  requireRole,
  requirePermission,
  requireTenantMatch
} = require('./jwt-rbac');

const router = express.Router();

// Every protected route first validates the JWT and then binds requests to its tenant.
router.use(authenticateJWT, requireTenantMatch);

// Owner: business settings only (plus the explicitly granted business-management areas).
router.use('/owner/settings', requireRole('OWNER'), requirePermission('business.settings.manage'));
router.use('/owner/staff', requireRole('OWNER'), requirePermission('staff.manage'));
router.use('/owner/tax', requireRole('OWNER'), requirePermission('tax.manage'));

// Manager: operational data viewing only.
router.use('/manager/operations', requireRole('MANAGER'), requirePermission('operations.read'));

// Cashier: POS only. Any other cashier URL reaches the explicit 403 handler below.
router.use('/pos', requireRole('CASHIER', 'OWNER'), requirePermission('pos.transact'));

router.use((req, res) => {
  res.status(403).json({ error: 'Forbidden: this URL is not authorized for your role.' });
});

module.exports = router;
