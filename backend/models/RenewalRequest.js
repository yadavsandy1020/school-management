const mongoose = require('mongoose');

const renewalRequestSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },

  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waiting_for_payment', 'activated', 'cancelled'],
    default: 'pending'
  },

  requestedPlan: String,
  requestedBillingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly', 'enterprise'],
    default: 'yearly'
  },

  requestedStudentCount: Number,
  requestedFeatures: [String],

  // Pricing proposed by Super Admin
  proposedPrice: Number,
  proposedDiscount: Number,
  finalPrice: Number,

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'waived'],
    default: 'pending'
  },
  paymentDate: Date,
  paymentMode: String,
  transactionId: String,

  // Activation details
  activatedAt: Date,
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activatedLicenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'License'
  },
  activatedSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },

  adminNotes: String,
  rejectionReason: String,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

renewalRequestSchema.index({ schoolId: 1, status: 1 });
renewalRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RenewalRequest', renewalRequestSchema);
