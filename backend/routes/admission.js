const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
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

router.route('/')
  .post(createAdmission)
  .get(protect, getAdmissions);

router.route('/:id')
  .get(protect, getAdmission)
  .put(protect, authorize('school_admin'), updateAdmission)
  .delete(protect, authorize('school_admin'), deleteAdmission);

router.put('/:id/review', protect, authorize('school_admin'), reviewAdmission);
router.put('/:id/approve', protect, authorize('school_admin'), approveAdmission);
router.put('/:id/reject', protect, authorize('school_admin'), rejectAdmission);
router.post('/:id/enroll', protect, authorize('school_admin'), enrollStudent);

module.exports = router;
