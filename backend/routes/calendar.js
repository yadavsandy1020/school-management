const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const calendarController = require('../controllers/calendarController');

router.use(protect, requireActiveLicense, requireFeature('CALENDAR'));

router.get('/events', requirePermission('NOTICE_VIEW'), calendarController.getEvents);
router.post('/events', authorize('super_admin', 'school_admin'), requirePermission('NOTICE_CREATE'), requireWriteAccess, calendarController.createEvent);
router.put('/events/:id', authorize('super_admin', 'school_admin'), requirePermission('NOTICE_CREATE'), requireWriteAccess, calendarController.updateEvent);
router.delete('/events/:id', authorize('super_admin', 'school_admin'), requirePermission('NOTICE_CREATE'), requireWriteAccess, calendarController.deleteEvent);

router.get('/messages', requirePermission('NOTICE_VIEW'), calendarController.getMessages);
router.post('/messages', authorize('super_admin', 'school_admin'), requirePermission('NOTICE_CREATE'), requireWriteAccess, calendarController.sendMessage);
router.put('/messages/:id/read', requirePermission('NOTICE_VIEW'), requireWriteAccess, calendarController.markAsRead);

module.exports = router;
