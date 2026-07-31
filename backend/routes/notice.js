const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
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
router.use(protect, requireActiveLicense, requireFeature('NOTICES'));

router.route('/')
  .post(authorize('school_admin', 'teacher'), requireWriteAccess, createNotice)
  .get(getNotices);

router.get('/my-notices', getMyNotices);

router.route('/:id')
  .get(getNotice)
  .put(authorize('school_admin', 'teacher'), requireWriteAccess, updateNotice)
  .delete(authorize('school_admin', 'teacher'), requireWriteAccess, deleteNotice);

router.put('/:id/pin', authorize('school_admin'), requireWriteAccess, togglePinNotice);

module.exports = router;
