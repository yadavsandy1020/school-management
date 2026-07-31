const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  amount: Number,
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  paidAmount: { type: Number, default: 0 },
  dueDate: Date,
  paidDate: Date,
  paymentMode: String,
  transactionId: String,
  notes: String
}, { _id: true, timestamps: true });

const renewalHistorySchema = new mongoose.Schema({
  plan: String,
  startDate: Date,
  endDate: Date,
  billingCycle: String,
  agreedPrice: Number,
  discount: Number,
  finalPrice: Number,
  invoice: invoiceSchema,
  activatedAt: Date,
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true, timestamps: true });

const subscriptionSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },

  // Commercial agreement
  plan: {
    type: String,
    required: true,
    default: 'free'
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },

  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  renewalDate: Date,

  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly', 'enterprise'],
    default: 'monthly'
  },

  studentPricingTier: {
    type: String,
    default: ''
  },

  agreedPrice: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  discountReason: String,
  finalPrice: {
    type: Number,
    default: 0
  },

  trialStatus: {
    isTrial: { type: Boolean, default: false },
    trialEndsAt: Date,
    convertedAt: Date
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'partial', 'waived'],
    default: 'pending'
  },

  invoiceHistory: [invoiceSchema],
  renewalHistory: [renewalHistorySchema],

  billingNotes: String,

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

subscriptionSchema.index({ schoolId: 1 });
subscriptionSchema.index({ expiryDate: 1 });
subscriptionSchema.index({ 'trialStatus.isTrial': 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
