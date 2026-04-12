const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const {
  createTimetable,
  getTimetables,
  getTimetable,
  updateTimetable,
  deleteTimetable,
  getClassTimetable
} = require('../controllers/timetableController');

router.use(paginate);

router.route('/')
  .post(protect, authorize('school_admin'), createTimetable)
  .get(protect, getTimetables);

router.route('/:id')
  .get(protect, getTimetable)
  .put(protect, authorize('school_admin'), updateTimetable)
  .delete(protect, authorize('school_admin'), deleteTimetable);

router.get('/class/:classId/:section', protect, getClassTimetable);

module.exports = router;
