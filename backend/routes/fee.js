const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const {
  createFeeStructure,
  getFeeStructures,
  updateFeeStructure,
  generateInvoice,
  getInvoices,
  getInvoice,
  recordPayment,
  generateReceipt,
  bulkGenerateInvoices
} = require('../controllers/feeController');

router.use(paginate);

// Fee Structure routes
router.post('/structure', protect, authorize('school_admin'), createFeeStructure);
router.get('/structure', protect, getFeeStructures);
router.put('/structure/:id', protect, authorize('school_admin'), updateFeeStructure);

// Invoice routes
router.post('/invoice', protect, authorize('school_admin'), generateInvoice);
router.get('/invoice', protect, getInvoices);
router.post('/invoice/bulk', protect, authorize('school_admin'), bulkGenerateInvoices);
router.get('/invoice/:id', protect, getInvoice);
router.put('/invoice/:id/payment', protect, authorize('school_admin'), recordPayment);
router.get('/invoice/:id/receipt', protect, generateReceipt);

module.exports = router;
