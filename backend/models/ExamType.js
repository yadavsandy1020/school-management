const mongoose = require('mongoose');

const examTypeSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  description: String,
  weightage: { type: Number, default: 100 },
  maxMarks: { type: Number, default: 100 },
  passingMarks: { type: Number, default: 33 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

examTypeSchema.index({ tenantId: 1, schoolId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('ExamType', examTypeSchema);
