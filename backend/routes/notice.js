const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
  togglePinNotice,
  getMyNotices
} = require('../controllers/noticeController');

router.use(paginate);

router.route('/')
  .post(protect, authorize('school_admin', 'teacher'), createNotice)
  .get(protect, getNotices);

router.get('/my-notices', protect, getMyNotices);

router.route('/:id')
  .get(protect, getNotice)
  .put(protect, authorize('school_admin', 'teacher'), updateNotice)
  .delete(protect, authorize('school_admin', 'teacher'), deleteNotice);

router.put('/:id/pin', protect, authorize('school_admin'), togglePinNotice);

module.exports = router;
