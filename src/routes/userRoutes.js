const express = require('express');
const router = express.Router();
const protectAdmin = require('../middleware/auth');
const {
  register,
  login,
  listCustomersAdmin,
  disableCustomer,
  enableCustomer,
} = require('../controllers/userController');

// Customer self-service (public)
router.post('/register', register);
router.post('/login', login);

// Admin routes (view/manage customers who've registered)
router.get('/admin/list', protectAdmin, listCustomersAdmin);
router.patch('/admin/:id/disable', protectAdmin, disableCustomer);
router.patch('/admin/:id/enable', protectAdmin, enableCustomer);

module.exports = router;