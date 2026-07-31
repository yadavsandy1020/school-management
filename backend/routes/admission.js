const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { requireActiveLicense, requireFeature, requireWriteAccess, checkStudentLimit } = require('../middleware/saas');
const {
  createAdmission,
  getAdmissions,
  getAdmission,
  updateAdmission,
  reviewAdmission,
  approveAdmission,
  rejectAdmission,
  enrollStudent,
  deleteAdmission
} = require('../controllers/admissionController');

router.use(paginate);
router.use(protect, requireActiveLicense, requireFeature('ADMISSIONS'));

router.route('/')
  .post(authorize('school_admin'), requireWriteAccess, createAdmission)
  .get(getAdmissions);

router.route('/:id')
  .get(getAdmission)
  .put(authorize('school_admin'), requireWriteAccess, updateAdmission)
  .delete(authorize('school_admin'), requireWriteAccess, deleteAdmission);

router.put('/:id/review', authorize('school_admin'), requireWriteAccess, reviewAdmission);
router.put('/:id/approve', authorize('school_admin'), requireWriteAccess, approveAdmission);
router.put('/:id/reject', authorize('school_admin'), requireWriteAccess, rejectAdmission);
router.post('/:id/enroll', authorize('school_admin'), requireWriteAccess, checkStudentLimit(1), enrollStudent);

module.exports = router;
