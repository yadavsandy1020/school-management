const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense } = require('../middleware/saas');
const { getAuditLogs } = require('../controllers/auditLogController');

router.use(protect, requireActiveLicense);

router.get('/', authorize('super_admin', 'school_admin'), requirePermission('AUDIT_LOG_VIEW'), getAuditLogs);

module.exports = router;
