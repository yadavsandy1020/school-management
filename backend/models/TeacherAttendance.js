const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'half_day'], required: true },
  remarks: String,
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

teacherAttendanceSchema.index({ date: 1, teacherId: 1, tenantId: 1 }, { unique: true });
teacherAttendanceSchema.index({ tenantId: 1, schoolId: 1 });

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
