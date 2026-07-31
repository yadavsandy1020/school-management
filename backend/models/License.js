const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
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
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },

  // --- Hard limits ---
  limits: {
    maxStudents: { type: Number, default: 0 },
    maxTeachers: { type: Number, default: 0 },
    maxStaff: { type: Number, default: 0 },
    maxBranches: { type: Number, default: 1 },
    storageLimitMB: { type: Number, default: 0 },
    apiLimitPerMonth: { type: Number, default: 0 },
    aiCredits: { type: Number, default: 0 },
    smsCredits: { type: Number, default: 0 },
    emailCredits: { type: Number, default: 0 },
    maxActiveUsers: { type: Number, default: 0 },
    reportExportLimit: { type: Number, default: 0 }
  },

  // --- Feature toggles included in this license ---
  includedFeatures: [{
    featureCode: {
      type: String,
      required: true
    },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveUntil: Date
  }],

  // --- Status flags ---
  status: {
    active: { type: Boolean, default: true },
    suspended: { type: Boolean, default: false },
    expired: { type: Boolean, default: false },
    trial: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false }
  },

  // --- Premium capabilities ---
  customDomain: {
    enabled: { type: Boolean, default: false },
    domain: String
  },
  whiteLabel: {
    enabled: { type: Boolean, default: false },
    branding: {
      logo: String,
      favicon: String,
      primaryColor: String,
      poweredByText: String
    }
  },
  backupFrequency: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },

  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: Date,

  lastSyncedAt: {
    type: Date,
    default: Date.now
  },

  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
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

licenseSchema.index({ schoolId: 1 });
licenseSchema.index({ validUntil: 1 });
licenseSchema.index({ 'status.active': 1, 'status.expired': 1 });

module.exports = mongoose.model('License', licenseSchema);
