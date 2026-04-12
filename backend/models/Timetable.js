const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  section: {
    type: String,
    required: true
  },
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: true
  },
  periods: [{
    periodNumber: {
      type: Number,
      required: true
    },
    startTime: String,
    endTime: String,
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    room: String
  }],
  academicSession: {
    type: String,
    required: true
  },
  tenantId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
timetableSchema.index({ classId: 1, section: 1, day: 1, academicSession: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
