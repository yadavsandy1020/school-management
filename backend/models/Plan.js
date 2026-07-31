const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,

  // Default limits when a school is assigned this plan
  defaultLimits: {
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

  // Features enabled by default for this plan
  defaultFeatures: [{
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ['enabled', 'disabled', 'beta', 'coming_soon'],
      default: 'enabled'
    }
  }],

  basePrice: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

planSchema.index({ isActive: 1, isPublic: 1, order: 1 });

module.exports = mongoose.model('Plan', planSchema);
