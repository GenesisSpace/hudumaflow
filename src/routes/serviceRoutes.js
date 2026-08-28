const express = require('express');
const router = express.Router();
const protectAdmin = require('../middleware/auth');
const {
  listServices,
  createService,
  listAllServicesAdmin,
  updateService,
  disableService,
  enableService,
} = require('../controllers/serviceController');

// Admin routes (must come before the public GET '/' so they're matched correctly)
router.get('/admin/all', protectAdmin, listAllServicesAdmin);
router.post('/', protectAdmin, createService);
router.put('/:id', protectAdmin, updateService);
router.patch('/:id/disable', protectAdmin, disableService);
router.patch('/:id/enable', protectAdmin, enableService);

// Public route
router.get('/', listServices);

module.exports = router;