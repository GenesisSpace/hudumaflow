const express = require('express');
const router = express.Router();
const protectAdmin = require('../middleware/auth');
const {
  listActiveMethods,
  createMethod,
  updateMethod,
  listAllMethodsAdmin,
} = require('../controllers/paymentMethodController');

router.get('/', listActiveMethods);
router.get('/admin/all', protectAdmin, listAllMethodsAdmin);
router.post('/', protectAdmin, createMethod);
router.put('/:id', protectAdmin, updateMethod);

module.exports = router;