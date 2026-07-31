const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const {
  createTimetable,
  getTimetables,
  getTimetable,
  updateTimetable,
  deleteTimetable,
  getClassTimetable
} = require('../controllers/timetableController');

router.use(paginate);
router.use(protect, requireActiveLicense, requireFeature('TIMETABLE'));

router.route('/')
  .post(authorize('school_admin'), requireWriteAccess, createTimetable)
  .get(getTimetables);

router.get('/class/:classId/:section', getClassTimetable);

router.route('/:id')
  .get(getTimetable)
  .put(authorize('school_admin'), requireWriteAccess, updateTimetable)
  .delete(authorize('school_admin'), requireWriteAccess, deleteTimetable);

module.exports = router;
