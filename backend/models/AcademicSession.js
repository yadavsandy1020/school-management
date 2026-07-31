const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  financialYear: {
    start: Date,
    end: Date,
    name: String
  },
  terms: [{
    name: String,
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

academicSessionSchema.index({ tenantId: 1, schoolId: 1, code: 1 }, { unique: true });
academicSessionSchema.index({ tenantId: 1, schoolId: 1, isCurrent: 1 });

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
