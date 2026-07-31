const mongoose = require('mongoose');

const teacherSalaryPaymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    trim: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  tenantId: {
    type: String,
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  month: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'online'],
    default: 'bank_transfer'
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

teacherSalaryPaymentSchema.index({ tenantId: 1, schoolId: 1 });
teacherSalaryPaymentSchema.index({ teacherId: 1, year: 1, month: 1 });

module.exports = mongoose.model('TeacherSalaryPayment', teacherSalaryPaymentSchema);
