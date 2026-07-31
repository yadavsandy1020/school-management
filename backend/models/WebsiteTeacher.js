const mongoose = require('mongoose');

const websiteTeacherSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  name: { type: String, required: true },
  role: { type: String, required: true },
  qualification: String,
  experience: String,
  image: String,
  specialization: String,
  social: {
    linkedin: String,
    twitter: String
  },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true }
}, {
  timestamps: true
});

websiteTeacherSchema.index({ tenantId: 1, schoolId: 1, order: 1 });

module.exports = mongoose.model('WebsiteTeacher', websiteTeacherSchema);
