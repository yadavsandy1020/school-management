const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getStudents,
  getTeachers,
  updateUserStatus
} = require('../controllers/userController');

router.route('/')
  .get(protect, getUsers);

router.get('/students', protect, getStudents);
router.get('/teachers', protect, getTeachers);

router.route('/:id')
  .get(protect, getUser)
  .put(protect, updateUser)
  .delete(protect, authorize('school_admin', 'super_admin'), deleteUser);

router.put('/:id/status', protect, authorize('school_admin', 'super_admin'), updateUserStatus);

module.exports = router;
