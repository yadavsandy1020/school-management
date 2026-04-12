const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const {
  markAttendance,
  updateAttendance,
  getAttendance,
  getAttendanceById,
  getStudentAttendance,
  getClassAttendanceReport,
  deleteAttendance
} = require('../controllers/attendanceController');

router.use(paginate);

router.route('/')
  .post(protect, authorize('school_admin', 'teacher'), markAttendance)
  .get(protect, getAttendance);

router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/report/:classId', protect, getClassAttendanceReport);

router.route('/:id')
  .get(protect, getAttendanceById)
  .put(protect, authorize('school_admin', 'teacher'), updateAttendance)
  .delete(protect, authorize('school_admin'), deleteAttendance);

module.exports = router;
