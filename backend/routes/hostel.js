const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const hostelController = require('../controllers/hostelController');

router.use(protect, requireActiveLicense, requireFeature('HOSTEL'));

router.get('/', requirePermission('HOSTEL_VIEW'), hostelController.getHostels);
router.post('/', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.createHostel);
router.put('/:id', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.updateHostel);
router.delete('/:id', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.deleteHostel);

router.get('/rooms', requirePermission('HOSTEL_VIEW'), hostelController.getRooms);
router.post('/rooms', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.createRoom);
router.put('/rooms/:id', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.updateRoom);
router.delete('/rooms/:id', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.deleteRoom);

router.get('/allocations', requirePermission('HOSTEL_VIEW'), hostelController.getAllocations);
router.post('/allocations', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.createAllocation);
router.put('/allocations/:id', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.updateAllocation);
router.delete('/allocations/:id', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.deleteAllocation);

router.get('/visitors', requirePermission('HOSTEL_VIEW'), hostelController.getVisitors);
router.post('/visitors', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.createVisitor);
router.put('/visitors/:id/out', authorize('super_admin', 'school_admin', 'hostel_manager'), requirePermission('HOSTEL_MANAGE'), requireWriteAccess, hostelController.updateVisitorOutTime);

module.exports = router;
