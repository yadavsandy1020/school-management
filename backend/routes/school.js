const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requireActiveLicense, requireWriteAccess } = require('../middleware/saas');
const {
  createSchool,
  getAllSchools,
  getSchool,
  getSchoolByTenantId,
  updateSchool,
  updateCustomization,
  updateSchoolStatus,
  deleteSchool,
  getSchoolStats,
  onboardSchool
} = require('../controllers/schoolController');

router.route('/')
  .post(protect, authorize('super_admin'), createSchool)
  .get(protect, authorize('super_admin'), getAllSchools);

router.post('/onboard', protect, authorize('super_admin'), onboardSchool);

router.get('/tenant/:tenantId', getSchoolByTenantId);

router.use(protect, requireActiveLicense);

router.route('/:id')
  .get(getSchool)
  .put(requireWriteAccess, updateSchool)
  .delete(authorize('super_admin'), requireWriteAccess, deleteSchool);

router.put('/:id/customization', requireWriteAccess, updateCustomization);
router.put('/:id/status', authorize('super_admin'), requireWriteAccess, updateSchoolStatus);
router.get('/:id/stats', authorize('school_admin', 'super_admin'), getSchoolStats);

module.exports = router;
