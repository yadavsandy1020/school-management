const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicSession: {
    type: String,
    required: true
  },
  fees: [{
    type: {
      type: String,
      required: true,
      enum: ['tuition', 'admission', 'library', 'lab', 'sports', 'transport', 'hostel', 'exam', 'other']
    },
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    dueDate: Date,
    isMandatory: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly'],
      default: 'one_time'
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  lateFee: {
    enabled: {
      type: Boolean,
      default: false
    },
    amountPerDay: Number,
    maxLateFee: Number
  },
  discount: {
    enabled: {
      type: Boolean,
      default: false
    },
    siblings: Number,
    earlyPayment: Number,
    scholarship: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
feeStructureSchema.index({ tenantId: 1, schoolId: 1 });
feeStructureSchema.index({ classId: 1, academicSession: 1 });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
