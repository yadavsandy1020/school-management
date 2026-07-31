const mongoose = require('mongoose');

const websiteAwardSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  title: { type: String, required: true },
  organization: String,
  year: String,
  image: String,
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

websiteAwardSchema.index({ tenantId: 1, schoolId: 1, order: 1 });

module.exports = mongoose.model('WebsiteAward', websiteAwardSchema);
