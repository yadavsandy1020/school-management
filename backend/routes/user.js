const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requireActiveLicense, requireWriteAccess } = require('../middleware/saas');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getStudents,
  getTeachers,
  updateUserStatus
} = require('../controllers/userController');

router.use(protect, requireActiveLicense);

router.route('/')
  .get(getUsers);

router.get('/students', getStudents);
router.get('/teachers', getTeachers);

router.route('/:id')
  .get(getUser)
  .put(requireWriteAccess, updateUser)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteUser);

router.put('/:id/status', authorize('school_admin', 'super_admin'), requireWriteAccess, updateUserStatus);

module.exports = router;
