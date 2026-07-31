const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const {
  createFeeStructure,
  getFeeStructures,
  getFeeStructure,
  updateFeeStructure,
  generateInvoice,
  getInvoices,
  getInvoice,
  recordPayment,
  generateReceipt,
  bulkGenerateInvoices,
  generateQuarterlyInvoices,
  getFeeDefaulters,
  getStudentPaymentReport,
  deleteInvoice,
  deleteFeeStructure
} = require('../controllers/feeController');

router.use(paginate);
router.use(protect, requireActiveLicense, requireFeature('FEES'));

// Fee Structure routes
router.post('/structure', authorize('school_admin'), requireWriteAccess, createFeeStructure);
router.get('/structure', authorize('school_admin', 'super_admin'), getFeeStructures);
router.get('/structure/:id', authorize('school_admin', 'super_admin'), getFeeStructure);
router.put('/structure/:id', authorize('school_admin'), requireWriteAccess, updateFeeStructure);
router.delete('/structure/:id', authorize('school_admin'), requireWriteAccess, deleteFeeStructure);

// Invoice routes
router.post('/invoice', authorize('school_admin'), requireWriteAccess, generateInvoice);
router.get('/invoice', authorize('school_admin', 'super_admin', 'parent'), getInvoices);
router.post('/invoice/bulk', authorize('school_admin', 'super_admin'), requireWriteAccess, bulkGenerateInvoices);
router.post('/invoice/quarterly', authorize('school_admin', 'super_admin'), requireWriteAccess, generateQuarterlyInvoices);
router.get('/defaulters', authorize('school_admin', 'super_admin', 'parent'), getFeeDefaulters);
router.get('/student/:studentId/payment-report', authorize('school_admin', 'super_admin', 'teacher', 'parent'), getStudentPaymentReport);
router.get('/invoice/:id', authorize('school_admin', 'super_admin', 'parent'), getInvoice);
router.post('/invoice/:id/payment', authorize('school_admin', 'super_admin'), requireWriteAccess, recordPayment);
router.put('/invoice/:id/payment', authorize('school_admin', 'super_admin'), requireWriteAccess, recordPayment);
router.get('/invoice/:id/receipt', authorize('school_admin', 'super_admin', 'parent'), generateReceipt);
router.delete('/invoice/:id', authorize('school_admin', 'super_admin'), requireWriteAccess, deleteInvoice);

module.exports = router;
