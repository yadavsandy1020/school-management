const mongoose = require('mongoose');

const pricingSlabSchema = new mongoose.Schema({
  plan: {
    type: String,
    default: 'default'
  },

  minStudents: {
    type: Number,
    required: true,
    min: 0
  },
  maxStudents: {
    type: Number,
    required: true
  },

  monthlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  quarterlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  halfYearlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  yearlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  enterprisePrice: {
    type: Number,
    default: 0
  },

  // Discounts at slab level
  discountPercent: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  order: {
    type: Number,
    default: 0
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

pricingSlabSchema.index({ plan: 1, minStudents: 1, maxStudents: 1 });
pricingSlabSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('PricingSlab', pricingSlabSchema);
