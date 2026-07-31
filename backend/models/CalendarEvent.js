const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: String,
  type: { type: String, enum: ['holiday', 'event', 'exam', 'meeting', 'activity', 'reminder'], default: 'event' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  color: String,
  audience: [{ type: String, enum: ['all', 'super_admin', 'school_admin', 'teacher', 'student', 'parent'] }],
  location: String,
  attachments: [String],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

calendarEventSchema.index({ tenantId: 1, schoolId: 1, startDate: -1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
