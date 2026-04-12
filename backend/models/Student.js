const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  admissionNo: {
    type: String,
    required: true,
    unique: true
  },
  rollNo: String,
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  section: {
    type: String,
    required: true
  },
  academicSession: {
    type: String,
    required: true
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
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    bloodGroup: String,
    religion: String,
    caste: String,
    nationality: {
      type: String,
      default: 'Indian'
    },
    motherTongue: String
  },
  contactInfo: {
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    phone: String,
    email: String
  },
  parentInfo: {
    fatherName: {
      type: String,
      required: true
    },
    fatherPhone: {
      type: String,
      required: true
    },
    fatherOccupation: String,
    fatherEmail: String,
    motherName: String,
    motherPhone: String,
    motherOccupation: String,
    motherEmail: String,
    guardianName: String,
    guardianRelation: String,
    guardianPhone: String
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  photo: String,
  admissionDate: {
    type: Date,
    default: Date.now
  },
  previousSchool: String,
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
  isAlumni: {
    type: Boolean,
    default: false
  },
  leavingDate: Date,
  leavingReason: String
}, {
  timestamps: true
});

// Indexes
studentSchema.index({ admissionNo: 1 });
studentSchema.index({ tenantId: 1, schoolId: 1 });
studentSchema.index({ classId: 1, section: 1 });
studentSchema.index({ academicSession: 1 });

module.exports = mongoose.model('Student', studentSchema);
