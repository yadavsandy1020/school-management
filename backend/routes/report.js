const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardStats,
  getAttendanceReport,
  getFeeReport,
  getStrengthReport,
  exportReport
} = require('../controllers/reportController');

router.get('/dashboard', protect, getDashboardStats);
router.get('/attendance', protect, getAttendanceReport);
router.get('/fees', protect, getFeeReport);
router.get('/strength', protect, getStrengthReport);
router.get('/export/:type', protect, exportReport);

module.exports = router;
