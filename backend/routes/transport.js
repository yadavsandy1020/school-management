const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const transportController = require('../controllers/transportController');

router.use(protect, requireActiveLicense, requireFeature('TRANSPORT'));

// Vehicles
router.get('/vehicles', requirePermission('TRANSPORT_VIEW'), transportController.getVehicles);
router.post('/vehicles', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.createVehicle);
router.put('/vehicles/:id', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.updateVehicle);
router.delete('/vehicles/:id', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.deleteVehicle);

// Drivers
router.get('/drivers', requirePermission('TRANSPORT_VIEW'), transportController.getDrivers);
router.post('/drivers', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.createDriver);
router.put('/drivers/:id', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.updateDriver);
router.delete('/drivers/:id', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.deleteDriver);

// Routes
router.get('/routes', requirePermission('TRANSPORT_VIEW'), transportController.getRoutes);
router.post('/routes', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.createRoute);
router.put('/routes/:id', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.updateRoute);
router.delete('/routes/:id', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.deleteRoute);

// Allocations
router.get('/allocations', requirePermission('TRANSPORT_VIEW'), transportController.getAllocations);
router.get('/allocations/student/:studentId', requirePermission('TRANSPORT_VIEW'), transportController.getStudentAllocation);
router.post('/allocations', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.createAllocation);
router.put('/allocations/:id', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.updateAllocation);
router.delete('/allocations/:id', authorize('super_admin', 'school_admin', 'transport_manager'), requirePermission('TRANSPORT_MANAGE'), requireWriteAccess, transportController.deleteAllocation);

module.exports = router;
