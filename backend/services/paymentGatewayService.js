const PaymentTransaction = require('../models/PaymentTransaction');
const FeeInvoice = require('../models/FeeInvoice');

const PaymentGatewayService = {
  /**
   * Create an order/payment intent.
   * Stub: replace with Razorpay/Stripe/PayU SDK integration.
   */
  async createOrder({ amount, currency = 'INR', invoiceId, studentId, tenantId, schoolId, gateway = 'test' }) {
    if (!amount || amount <= 0) throw new Error('Valid amount is required');

    const transaction = await PaymentTransaction.create({
      tenantId,
      schoolId,
      invoiceId,
      studentId,
      amount,
      currency,
      gateway,
      gatewayOrderId: `order_${Date.now()}`,
      status: 'created'
    });

    if (gateway === 'test') {
      return {
        success: true,
        gateway,
        orderId: transaction.gatewayOrderId,
        amount,
        currency,
        key: process.env.PAYMENT_TEST_KEY || 'test_key',
        transactionId: transaction._id
      };
    }

    throw new Error(`Gateway '${gateway}' not configured`);
  },

  /**
   * Verify and record payment.
   * Stub: in production validate signature with gateway SDK.
   */
  async verifyPayment({ transactionId, gatewayPaymentId, gatewaySignature }) {
    const transaction = await PaymentTransaction.findById(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    transaction.gatewayPaymentId = gatewayPaymentId;
    transaction.gatewaySignature = gatewaySignature;
    transaction.status = 'success';
    await transaction.save();

    if (transaction.invoiceId) {
      const invoice = await FeeInvoice.findById(transaction.invoiceId);
      if (invoice) {
        invoice.paidAmount += transaction.amount;
        invoice.balanceAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
        invoice.status = invoice.balanceAmount <= 0 ? 'paid' : 'partial';
        await invoice.save();
      }
    }

    return { success: true, transaction };
  },

  /**
   * Get transaction history.
   */
  async getTransactions(filter) {
    return await PaymentTransaction.find(filter).sort({ createdAt: -1 });
  }
};

module.exports = PaymentGatewayService;
