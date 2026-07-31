const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    required: true,
    default: 'general'
  },
  icon: String,

  // Platform-wide default availability
  defaultStatus: {
    type: String,
    enum: ['enabled', 'disabled', 'beta', 'coming_soon'],
    default: 'disabled'
  },

  // Is this a paid add-on?
  isAddOn: {
    type: Boolean,
    default: false
  },
  addOnPrice: {
    type: Number,
    default: 0
  },

  // Dependencies — other features that must be enabled
  requires: [{
    type: String
  }],

  // Module code for routing/API grouping
  moduleCode: String,

  order: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

featureSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('Feature', featureSchema);
