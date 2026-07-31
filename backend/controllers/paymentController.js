const PaymentGatewayService = require('../services/paymentGatewayService');
const FeeInvoice = require('../models/FeeInvoice');

const tenantFilter = (req) => ({ tenantId: req.user.tenantId, schoolId: req.user.schoolId });

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, invoiceId, studentId, gateway } = req.body;
    const result = await PaymentGatewayService.createOrder({
      amount,
      currency,
      invoiceId,
      studentId,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      gateway
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { transactionId, gatewayPaymentId, gatewaySignature } = req.body;
    const result = await PaymentGatewayService.verifyPayment({ transactionId, gatewayPaymentId, gatewaySignature });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await PaymentGatewayService.getTransactions({ ...tenantFilter(req) });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUnpaidInvoices = async (req, res) => {
  try {
    const invoices = await FeeInvoice.find({
      ...tenantFilter(req),
      status: { $ne: 'paid' },
      isActive: true
    }).populate('studentId', 'personalInfo admissionNo').populate('classId', 'name').sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
