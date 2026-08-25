const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const protectCustomer = require('../middleware/customerAuth');
const protectAdmin = require('../middleware/auth');
const {
  submitApplication,
  myApplications,
  listApplicationsAdmin,
  getApplicationByIdAdmin,
  updateStatus,
  decideApplication,
  uploadDocument,
  submitPayment,
  verifyPayment,
  trackByTrackingId,
   getDashboardStats,
} = require('../controllers/applicationController');

// Public route (no login needed)
router.get('/track/:trackingId', trackByTrackingId);
router.get('/stats/summary', protectAdmin, getDashboardStats);

// Customer routes
router.post('/', protectCustomer, submitApplication);
router.get('/mine', protectCustomer, myApplications);
router.post('/:id/documents', protectCustomer, upload.single('file'), uploadDocument);
router.patch('/:id/payment', protectCustomer, submitPayment);

// Admin routes
router.get('/', protectAdmin, listApplicationsAdmin);
router.patch('/:id/status', protectAdmin, updateStatus);
router.patch('/:id/decision', protectAdmin, decideApplication);
router.patch('/:id/payment/verify', protectAdmin, verifyPayment);
router.get('/:id', protectAdmin, getApplicationByIdAdmin);

module.exports = router;