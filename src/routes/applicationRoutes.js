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
  createApplicationAdmin,
  getApplicationByIdAdmin,
  updateStatus,
  decideApplication,
  uploadDocument,
  uploadDocumentAdmin,
  submitPayment,
  verifyPayment,
  trackByTrackingId,
  getDashboardStats,
} = require('../controllers/applicationController');

// Public route (no login needed)
router.get('/track/:trackingId', trackByTrackingId);

// Customer routes
router.post('/', protectCustomer, submitApplication);
router.get('/mine', protectCustomer, myApplications);
router.post('/:id/documents', protectCustomer, upload.single('file'), uploadDocument);
router.patch('/:id/payment', protectCustomer, submitPayment);

// Admin routes
router.get('/', protectAdmin, listApplicationsAdmin);
router.post('/admin', protectAdmin, createApplicationAdmin);
router.get('/stats/summary', protectAdmin, getDashboardStats);
router.post('/:id/documents/admin', protectAdmin, upload.single('file'), uploadDocumentAdmin);
router.patch('/:id/status', protectAdmin, updateStatus);
router.patch('/:id/decision', protectAdmin, decideApplication);
router.patch('/:id/payment/verify', protectAdmin, verifyPayment);
router.get('/:id', protectAdmin, getApplicationByIdAdmin);

module.exports = router;