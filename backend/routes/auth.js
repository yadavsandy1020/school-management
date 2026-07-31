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
  logout,
  forgotPassword,
  resetPassword,
  parentLogin
} = require('../controllers/authController');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/parent-login', parentLogin);
router.post('/refresh', refreshToken);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
