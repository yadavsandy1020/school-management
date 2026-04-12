const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { validate, teacherSchema } = require('../middleware/validator');
const {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  assignSubjects,
  assignClasses,
  updateSalary
} = require('../controllers/teacherController');

router.use(paginate);

router.route('/')
  .post(protect, authorize('school_admin', 'super_admin'), validate(teacherSchema), createTeacher)
  .get(protect, getTeachers);

router.route('/:id')
  .get(protect, getTeacher)
  .put(protect, authorize('school_admin'), validate(teacherSchema), updateTeacher)
  .delete(protect, authorize('school_admin'), deleteTeacher);

router.put('/:id/subjects', protect, authorize('school_admin'), assignSubjects);
router.put('/:id/classes', protect, authorize('school_admin'), assignClasses);
router.put('/:id/salary', protect, authorize('school_admin'), updateSalary);

module.exports = router;
