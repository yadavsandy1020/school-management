const mongoose = require('mongoose');

const marksEntrySchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  section: String,
  marksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  passingMarks: { type: Number, default: 33 },
  grade: String,
  remarks: String,
  isAbsent: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

marksEntrySchema.index({ tenantId: 1, schoolId: 1, examId: 1, studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('MarksEntry', marksEntrySchema);
