const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  addSection,
  removeSection,
  assignSubjects
} = require('../controllers/classController');

router.use(paginate);

router.route('/')
  .post(protect, authorize('school_admin'), createClass)
  .get(protect, getClasses);

router.post('/:id/sections', protect, authorize('school_admin'), addSection);
router.delete('/:id/sections/:section', protect, authorize('school_admin'), removeSection);
router.put('/:id/subjects', protect, authorize('school_admin'), assignSubjects);

router.route('/:id')
  .get(protect, getClass)
  .put(protect, authorize('school_admin'), updateClass)
  .delete(protect, authorize('school_admin'), deleteClass);

module.exports = router;
