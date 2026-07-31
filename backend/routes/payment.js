const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const paymentController = require('../controllers/paymentController');

router.use(protect, requireActiveLicense, requireFeature('FEES'));

router.get('/invoices', requirePermission('FEE_INVOICE_VIEW'), paymentController.getUnpaidInvoices);
router.post('/order', requirePermission('FEE_PAYMENT_RECORD'), requireWriteAccess, paymentController.createOrder);
router.post('/verify', requirePermission('FEE_PAYMENT_RECORD'), requireWriteAccess, paymentController.verifyPayment);
router.get('/transactions', authorize('super_admin', 'school_admin'), requirePermission('FEE_INVOICE_VIEW'), paymentController.getTransactions);

module.exports = router;
