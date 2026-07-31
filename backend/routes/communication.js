const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const communicationController = require('../controllers/communicationController');

router.use(protect, requireActiveLicense);

router.post('/email', authorize('super_admin', 'school_admin'), requirePermission('EMAIL_SEND'), requireFeature('EMAIL'), requireWriteAccess, communicationController.sendEmail);
router.post('/sms', authorize('super_admin', 'school_admin'), requirePermission('SMS_SEND'), requireFeature('SMS'), requireWriteAccess, communicationController.sendSMS);
router.post('/bulk', authorize('super_admin', 'school_admin'), requirePermission('NOTICE_CREATE'), requireFeature('BULK_MESSAGING'), requireWriteAccess, communicationController.sendBulk);
router.get('/logs', requirePermission('NOTICE_VIEW'), communicationController.getCommunicationLogs);
router.get('/whatsapp-link', communicationController.getWhatsAppLink);
router.get('/notices/parent', authorize('parent'), communicationController.getNoticesForParent);

module.exports = router;
