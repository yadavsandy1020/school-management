const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validator');
const {
  register,
  login,
  getMe,
  updatePassword,
  refreshToken,
  logout
} = require('../controllers/authController');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
