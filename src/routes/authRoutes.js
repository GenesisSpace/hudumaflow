const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const protect = require('../middleware/auth');
const Admin = require('../models/Admin');

router.post('/login', login);

// Protected test route — proves the middleware works
router.get('/me', protect, async (req, res) => {
  const admin = await Admin.findById(req.adminId).select('-passwordHash');
  res.json(admin);
});

module.exports = router;