const express = require('express');
const router = express.Router();
const { register, verifyOtp, login } = require('../controllers/userController');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

module.exports = router;