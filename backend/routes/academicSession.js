const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  setCurrent
} = require('../controllers/academicSessionController');

router.use(protect, requireActiveLicense, requireFeature('ACADEMIC'));

router.get('/', requirePermission('SETTINGS_VIEW', 'CLASS_VIEW'), getSessions);
router.get('/:id', requirePermission('SETTINGS_VIEW'), getSession);
router.post('/', authorize('super_admin', 'school_admin'), requirePermission('SETTINGS_MANAGE'), requireWriteAccess, createSession);
router.put('/:id', authorize('super_admin', 'school_admin'), requirePermission('SETTINGS_MANAGE'), requireWriteAccess, updateSession);
router.delete('/:id', authorize('super_admin', 'school_admin'), requirePermission('SETTINGS_MANAGE'), requireWriteAccess, deleteSession);
router.post('/:id/set-current', authorize('super_admin', 'school_admin'), requirePermission('SETTINGS_MANAGE'), requireWriteAccess, setCurrent);

module.exports = router;
