const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examNumber: { type: String, trim: true },
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession' },
  name: { type: String, required: true, trim: true },
  examType: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  subjects: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: String,
    examDate: Date,
    startTime: String,
    endTime: String,
    maxMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 33 }
  }],
  isResultPublished: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

examSchema.index({ tenantId: 1, schoolId: 1, startDate: -1 });

module.exports = mongoose.model('Exam', examSchema);
