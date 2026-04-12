const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createSchool,
  getAllSchools,
  getSchool,
  getSchoolByTenantId,
  updateSchool,
  updateCustomization,
  updateSchoolStatus,
  deleteSchool,
  getSchoolStats
} = require('../controllers/schoolController');

router.route('/')
  .post(protect, authorize('super_admin'), createSchool)
  .get(protect, authorize('super_admin'), getAllSchools);

router.get('/tenant/:tenantId', getSchoolByTenantId);

router.route('/:id')
  .get(protect, getSchool)
  .put(protect, updateSchool)
  .delete(protect, authorize('super_admin'), deleteSchool);

router.put('/:id/customization', protect, updateCustomization);
router.put('/:id/status', protect, authorize('super_admin'), updateSchoolStatus);
router.get('/:id/stats', protect, getSchoolStats);

module.exports = router;
