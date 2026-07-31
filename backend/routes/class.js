const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  addSection,
  removeSection,
  assignSubjects
} = require('../controllers/classController');

router.use(paginate);
router.use(protect, requireActiveLicense, requireFeature('ACADEMIC'));

router.route('/')
  .post(authorize('school_admin'), requireWriteAccess, createClass)
  .get(getClasses);

router.post('/:id/sections', authorize('school_admin'), requireWriteAccess, addSection);
router.delete('/:id/sections/:section', authorize('school_admin'), requireWriteAccess, removeSection);
router.put('/:id/subjects', authorize('school_admin'), requireWriteAccess, assignSubjects);

router.route('/:id')
  .get(getClass)
  .put(authorize('school_admin'), requireWriteAccess, updateClass)
  .delete(authorize('school_admin'), requireWriteAccess, deleteClass);

module.exports = router;
