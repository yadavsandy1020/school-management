const mongoose = require('mongoose');

const websiteFAQSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, default: 'General' },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true }
}, {
  timestamps: true
});

websiteFAQSchema.index({ tenantId: 1, schoolId: 1, order: 1 });

module.exports = mongoose.model('WebsiteFAQ', websiteFAQSchema);
