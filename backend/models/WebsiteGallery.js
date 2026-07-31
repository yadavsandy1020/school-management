const mongoose = require('mongoose');

const websiteGallerySchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  title: { type: String, required: true },
  category: { type: String, default: 'Events' },
  coverImage: { type: String, required: true },
  images: [String],
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

websiteGallerySchema.index({ tenantId: 1, schoolId: 1, order: 1 });

module.exports = mongoose.model('WebsiteGallery', websiteGallerySchema);
