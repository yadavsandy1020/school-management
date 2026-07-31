const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  attachment: { type: String },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicSession: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

homeworkSchema.index({ tenantId: 1, schoolId: 1, classId: 1, section: 1 });
homeworkSchema.index({ dueDate: -1 });

module.exports = mongoose.model('Homework', homeworkSchema);
