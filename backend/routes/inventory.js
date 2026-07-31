const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const inventoryController = require('../controllers/inventoryController');

router.use(protect, requireActiveLicense, requireFeature('INVENTORY'));

router.get('/categories', requirePermission('INVENTORY_VIEW'), inventoryController.getCategories);

router.get('/', requirePermission('INVENTORY_VIEW'), inventoryController.getItems);
router.post('/', authorize('super_admin', 'school_admin', 'inventory_manager'), requirePermission('INVENTORY_MANAGE'), requireWriteAccess, inventoryController.createItem);
router.put('/:id', authorize('super_admin', 'school_admin', 'inventory_manager'), requirePermission('INVENTORY_MANAGE'), requireWriteAccess, inventoryController.updateItem);
router.delete('/:id', authorize('super_admin', 'school_admin', 'inventory_manager'), requirePermission('INVENTORY_MANAGE'), requireWriteAccess, inventoryController.deleteItem);

router.get('/movements', requirePermission('INVENTORY_VIEW'), inventoryController.getMovements);
router.post('/movements', authorize('super_admin', 'school_admin', 'inventory_manager'), requirePermission('INVENTORY_MANAGE'), requireWriteAccess, inventoryController.recordMovement);

module.exports = router;
