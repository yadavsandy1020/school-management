const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  personalInfo: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    bloodGroup: String
  },
  contactInfo: {
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    emergencyContact: String
  },
  employmentDetails: {
    designation: {
      type: String,
      required: true
    },
    department: String,
    joinDate: {
      type: Date,
      required: true
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'contract', 'temporary'],
      default: 'permanent'
    },
    qualification: String,
    experience: {
      type: Number,
      default: 0
    },
    specialization: String
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classes: [{
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    role: {
      type: String,
      enum: ['class_teacher', 'subject_teacher', 'both']
    }
  }],
  salaryDetails: {
    basicSalary: Number,
    allowances: {
      da: Number,
      hra: Number,
      ta: Number,
      others: Number
    },
    totalSalary: Number,
    paymentMode: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque'],
      default: 'bank_transfer'
    },
    bankDetails: {
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      branch: String
    }
  },
  photo: String,
  documents: [{
    name: String,
    file: String
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  leavingDate: Date,
  leavingReason: String
}, {
  timestamps: true
});

// Indexes
teacherSchema.index({ employeeId: 1 });
teacherSchema.index({ tenantId: 1, schoolId: 1 });
teacherSchema.index({ schoolId: 1, isActive: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
