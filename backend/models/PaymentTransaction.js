const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeInvoice' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  gateway: { type: String, enum: ['razorpay', 'stripe', 'payu', 'cash', 'manual', 'test'], default: 'test' },
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  status: { type: String, enum: ['created', 'pending', 'success', 'failed', 'refunded'], default: 'created' },
  metadata: Object,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

paymentTransactionSchema.index({ tenantId: 1, schoolId: 1, status: 1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
