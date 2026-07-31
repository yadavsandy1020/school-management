const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
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

  featureCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  status: {
    type: String,
    enum: ['enabled', 'disabled', 'beta', 'coming_soon'],
    default: 'disabled'
  },

  // Explicit override or inherited from plan/license
  source: {
    type: String,
    enum: ['plan', 'license', 'manual', 'marketplace'],
    default: 'plan'
  },

  enabledAt: Date,
  disabledAt: Date,

  // Who toggled it
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Optional expiry for temporary add-ons
  expiresAt: Date,

  notes: String
}, {
  timestamps: true
});

featureFlagSchema.index({ tenantId: 1, featureCode: 1 }, { unique: true });
featureFlagSchema.index({ schoolId: 1, featureCode: 1 });
featureFlagSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
