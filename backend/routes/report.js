const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const {
  getDashboardStats,
  getAttendanceReport,
  getFeeReport,
  getStrengthReport,
  exportReport,
  getTrendsReport,
  getExamReport,
  getFinanceReport
} = require('../controllers/reportController');

router.use(protect, requireActiveLicense, requireFeature('REPORTS'));

router.get('/dashboard', getDashboardStats);
router.get('/attendance', authorize('school_admin', 'super_admin', 'teacher', 'parent'), getAttendanceReport);
router.get('/fees', authorize('school_admin', 'super_admin', 'parent'), getFeeReport);
router.get('/strength', authorize('school_admin', 'super_admin'), getStrengthReport);
router.get('/trends', authorize('school_admin', 'super_admin'), getTrendsReport);
router.get('/exams', authorize('school_admin', 'super_admin', 'teacher', 'parent'), getExamReport);
router.get('/finance', authorize('school_admin', 'super_admin'), getFinanceReport);
router.get('/export/:type', authorize('school_admin', 'super_admin'), requireWriteAccess, exportReport);

module.exports = router;
