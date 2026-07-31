const mongoose = require('mongoose');

const websiteBlogSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  title: { type: String, required: true },
  slug: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, default: '' },
  coverImage: String,
  author: { type: String, default: 'Admin' },
  category: { type: String, default: 'General' },
  tags: [String],
  publishedAt: { type: Date, default: Date.now },
  featured: { type: Boolean, default: false },
  readTime: { type: Number, default: 5 },
  isVisible: { type: Boolean, default: true }
}, {
  timestamps: true
});

websiteBlogSchema.index({ tenantId: 1, schoolId: 1, slug: 1 });
websiteBlogSchema.index({ tenantId: 1, schoolId: 1, publishedAt: -1 });

module.exports = mongoose.model('WebsiteBlog', websiteBlogSchema);
