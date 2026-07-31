const mongoose = require('mongoose');

const websiteProgramSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  name: { type: String, required: true },
  ageRange: { type: String, required: true },
  description: { type: String, required: true },
  image: String,
  features: [String],
  schedule: String,
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true }
}, {
  timestamps: true
});

websiteProgramSchema.index({ tenantId: 1, schoolId: 1, order: 1 });

module.exports = mongoose.model('WebsiteProgram', websiteProgramSchema);
