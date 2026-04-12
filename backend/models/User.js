const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String
  },
  role: {
    type: String,
    enum: ['super_admin', 'school_admin', 'teacher', 'student', 'parent'],
    required: true
  },
  tenantId: {
    type: String,
    required: function () {
      return this.role !== 'super_admin';
    }
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: function () {
      return this.role !== 'super_admin';
    }
  },
  profile: {
    photo: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  // For student role
  studentDetails: {
    admissionNo: String,
    rollNo: String,
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    section: String,
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrollmentDate: Date
  },
  // For teacher role
  teacherDetails: {
    employeeId: String,
    designation: String,
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }],
    classTeacherFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    joinDate: Date,
    qualification: String,
    experience: Number
  },
  // For parent role
  parentDetails: {
    occupation: String,
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: String
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate reset token
userSchema.methods.getResetPasswordToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ schoolId: 1 });

module.exports = mongoose.model('User', userSchema);
