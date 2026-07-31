const mongoose = require('mongoose');

const numberSequenceSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'student', 'teacher', 'employee', 'admission', 'parent',
      'book', 'libraryIssue', 'invoice', 'feeReceipt', 'expense',
      'salarySlip', 'purchaseOrder', 'transportRoute', 'hostelRoom',
      'hostelAllocation', 'hostelVisitor',
      'payment', 'notice', 'exam', 'class',
      'document', 'certificate', 'marksheet', 'idcard'
    ]
  },
  prefix: {
    type: String,
    default: ''
  },
  currentNumber: {
    type: Number,
    default: 0
  },
  numberLength: {
    type: Number,
    default: 5
  },
  includeAcademicYear: {
    type: Boolean,
    default: true
  },
  includeFinancialYear: {
    type: Boolean,
    default: false
  },
  includeBranchCode: {
    type: Boolean,
    default: false
  },
  includeSchoolCode: {
    type: Boolean,
    default: false
  },
  separator: {
    type: String,
    default: '-'
  },
  resetPolicy: {
    type: String,
    enum: ['never', 'academicYear', 'financialYear', 'monthly', 'yearly'],
    default: 'academicYear'
  },
  resetContext: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

numberSequenceSchema.index({ tenantId: 1, schoolId: 1, entityType: 1, resetContext: 1 }, { unique: true });

module.exports = mongoose.model('NumberSequence', numberSequenceSchema);
