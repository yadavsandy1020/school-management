const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { validate, teacherSchema } = require('../middleware/validator');
const { requireActiveLicense, requireFeature, requireWriteAccess, checkTeacherLimit } = require('../middleware/saas');
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
router.use(protect, requireActiveLicense, requireFeature('TEACHERS'));

router.route('/')
  .post(authorize('school_admin', 'super_admin'), checkTeacherLimit(1), validate(teacherSchema), createTeacher)
  .get(getTeachers);

router.route('/:id')
  .get(getTeacher)
  .put(authorize('school_admin'), requireWriteAccess, validate(teacherSchema), updateTeacher)
  .delete(authorize('school_admin'), requireWriteAccess, deleteTeacher);

router.put('/:id/subjects', authorize('school_admin'), requireWriteAccess, assignSubjects);
router.put('/:id/classes', authorize('school_admin'), requireWriteAccess, assignClasses);
router.put('/:id/salary', authorize('school_admin'), requireWriteAccess, updateSalary);

module.exports = router;
