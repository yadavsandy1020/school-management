const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { validate, studentSchema } = require('../middleware/validator');
const { requireActiveLicense, requireFeature, checkStudentLimit, requireWriteAccess } = require('../middleware/saas');
const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  linkParent,
  bulkImportStudents,
  getStudentByAdmissionNo,
  getStudentProfile
} = require('../controllers/studentController');

router.use(paginate);
router.use(protect, requireActiveLicense, requireFeature('STUDENTS'));

router.route('/')
  .post(authorize('school_admin'), checkStudentLimit(1), validate(studentSchema), createStudent)
  .get(authorize('school_admin', 'teacher', 'super_admin'), getStudents);

router.post('/bulk', authorize('school_admin'), checkStudentLimit(req => req.body.students?.length || 1), bulkImportStudents);

router.get('/profile', authorize('student'), getStudentProfile);

router.route('/:id')
  .get(authorize('school_admin', 'teacher', 'super_admin'), getStudent)
  .put(authorize('school_admin'), requireWriteAccess, validate(studentSchema), updateStudent)
  .delete(authorize('school_admin'), requireWriteAccess, deleteStudent);

router.put('/:id/link-parent', authorize('school_admin'), requireWriteAccess, linkParent);

router.get('/admission/:admissionNo', authorize('school_admin', 'teacher', 'super_admin'), getStudentByAdmissionNo);

module.exports = router;
