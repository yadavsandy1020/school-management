const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  applicationNo: {
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
  academicSession: {
    type: String,
    required: true
  },
  classApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'enrolled'],
    default: 'pending'
  },
  studentInfo: {
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
    motherTongue: String,
    photo: String
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
    motherEmail: String
  },
  previousEducation: {
    lastSchool: String,
    lastClass: String,
    lastBoard: String,
    transferCertificate: String,
    markSheet: String
  },
  documents: [{
    name: String,
    file: String
  }],
  remarks: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  enrolledStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
admissionSchema.index({ applicationNo: 1 });
admissionSchema.index({ tenantId: 1, schoolId: 1 });
admissionSchema.index({ status: 1, academicSession: 1 });

module.exports = mongoose.model('Admission', admissionSchema);
