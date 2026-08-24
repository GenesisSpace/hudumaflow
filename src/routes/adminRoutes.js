const express = require('express');
const router = express.Router();
const protectAdmin = require('../middleware/auth');
const { listAdmins, createAdmin, disableAdmin ,enableAdmin} = require('../controllers/adminController');


router.get('/', protectAdmin, listAdmins);
router.post('/', protectAdmin, createAdmin);
router.patch('/:id/disable', protectAdmin, disableAdmin);
router.patch('/:id/enable', protectAdmin, enableAdmin);

module.exports = router;