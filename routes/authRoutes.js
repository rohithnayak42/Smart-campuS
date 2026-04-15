const express = require('express');
const router = express.Router();
const { login, verifyOtp, changePassword, devLogin } = require('../controllers/authController');

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/change-password', changePassword);
router.post('/dev-login', devLogin);

module.exports = router;
