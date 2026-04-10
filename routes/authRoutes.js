const express = require('express');
const router = express.Router();
const { login, verifyOtp, changePassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/change-password', changePassword);

module.exports = router;
