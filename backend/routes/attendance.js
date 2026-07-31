const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const {
  markAttendance,
  updateAttendance,
  getAttendance,
  getAttendanceById,
  getStudentAttendance,
  getStudentAttendanceSummary,
  getClassAttendanceReport,
  deleteAttendance,
  markSelfAttendance,
  getSelfAttendance,
  getAllTeacherAttendance
} = require('../controllers/attendanceController');

router.use(paginate);
router.use(protect, requireActiveLicense, requireFeature('ATTENDANCE'));

router.route('/')
  .post(authorize('school_admin', 'teacher'), requireWriteAccess, markAttendance)
  .get(authorize('school_admin', 'super_admin', 'teacher', 'parent'), getAttendance);

// Teacher self-attendance
router.post('/self', authorize('teacher'), markSelfAttendance);
router.get('/self', authorize('teacher'), getSelfAttendance);

// Teacher attendance admin view
router.get('/teachers', authorize('school_admin', 'super_admin'), getAllTeacherAttendance);

// Student attendance
router.get('/student/:studentId/summary', getStudentAttendanceSummary);
router.get('/student/:studentId', getStudentAttendance);
router.get('/report/:classId', getClassAttendanceReport);

router.route('/:id')
  .get(getAttendanceById)
  .put(authorize('school_admin', 'teacher'), requireWriteAccess, updateAttendance)
  .delete(authorize('school_admin'), requireWriteAccess, deleteAttendance);

module.exports = router;
