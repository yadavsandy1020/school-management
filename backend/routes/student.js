const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { validate, studentSchema } = require('../middleware/validator');
const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  linkParent,
  bulkImportStudents,
  getStudentByAdmissionNo
} = require('../controllers/studentController');

router.use(paginate);

router.route('/')
  .post(protect, authorize('school_admin'), validate(studentSchema), createStudent)
  .get(protect, getStudents);

router.post('/bulk', protect, authorize('school_admin'), bulkImportStudents);

router.route('/:id')
  .get(protect, getStudent)
  .put(protect, authorize('school_admin'), validate(studentSchema), updateStudent)
  .delete(protect, authorize('school_admin'), deleteStudent);

router.put('/:id/link-parent', protect, authorize('school_admin'), linkParent);

router.get('/admission/:admissionNo', protect, getStudentByAdmissionNo);

module.exports = router;
