const mongoose = require('mongoose');

const websiteTestimonialSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  name: { type: String, required: true },
  role: { type: String, required: true },
  parentOf: String,
  content: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  image: String,
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true }
}, {
  timestamps: true
});

websiteTestimonialSchema.index({ tenantId: 1, schoolId: 1, order: 1 });

module.exports = mongoose.model('WebsiteTestimonial', websiteTestimonialSchema);
