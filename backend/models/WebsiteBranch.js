const mongoose = require('mongoose');

const websiteBranchSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  name: { type: String, required: true },
  address: String,
  city: String,
  phone: String,
  email: String,
  timings: { type: String, default: '8:00 AM - 7:00 PM' },
  mapEmbed: String,
  image: String,
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

websiteBranchSchema.index({ tenantId: 1, schoolId: 1, order: 1 });

module.exports = mongoose.model('WebsiteBranch', websiteBranchSchema);
