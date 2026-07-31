const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireWriteAccess } = require('../middleware/saas');
const {
  getPermissions,
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/roleController');

router.use(protect, requireActiveLicense);

router.get('/permissions', requirePermission('ROLE_MANAGE', 'SETTINGS_VIEW'), getPermissions);
router.get('/', requirePermission('ROLE_MANAGE', 'SETTINGS_VIEW'), getRoles);
router.get('/:id', requirePermission('ROLE_MANAGE', 'SETTINGS_VIEW'), getRole);
router.post('/', authorize('super_admin', 'school_admin'), requirePermission('ROLE_MANAGE'), requireWriteAccess, createRole);
router.put('/:id', authorize('super_admin', 'school_admin'), requirePermission('ROLE_MANAGE'), requireWriteAccess, updateRole);
router.delete('/:id', authorize('super_admin', 'school_admin'), requirePermission('ROLE_MANAGE'), requireWriteAccess, deleteRole);

module.exports = router;
