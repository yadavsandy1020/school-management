const mongoose = require('mongoose');

const schoolExpenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    trim: true
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  paidTo: {
    type: String,
    trim: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'online'],
    default: 'cash'
  },
  receiptUrl: {
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

schoolExpenseSchema.index({ tenantId: 1, schoolId: 1 });
schoolExpenseSchema.index({ date: -1 });

module.exports = mongoose.model('SchoolExpense', schoolExpenseSchema);
