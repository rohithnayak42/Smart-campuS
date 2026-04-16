const express = require('express');
const router = express.Router();
const { login, verifyOtp, changePassword, resendOtp, forgotPassword, verifyForgotOtp } = require('../controllers/authController');

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/change-password', changePassword);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-otp', verifyForgotOtp);

module.exports = router;
