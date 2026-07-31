const mongoose = require('mongoose');

const documentVerificationSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },

  verificationToken: { type: String, required: true, unique: true, index: true },
  documentNo: { type: String, required: true, index: true },
  documentType: { type: String, required: true, index: true },
  subType: { type: String, default: '' },

  generatedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedDocument' },

  // Minimal public info for verification (no sensitive data)
  publicInfo: {
    documentType: String,
    documentNo: String,
    issueDate: Date,
    status: String,
    schoolName: String,
    studentName: String,
  },

  expiresAt: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

documentVerificationSchema.index({ tenantId: 1, schoolId: 1, documentNo: 1 });

module.exports = mongoose.model('DocumentVerification', documentVerificationSchema);
