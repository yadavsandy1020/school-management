const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  subdomain: {
    type: String,
    unique: true,
    lowercase: true
  },
  logo: {
    type: String
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#3b82f6'
    },
    secondaryColor: {
      type: String,
      default: '#1e40af'
    },
    accentColor: {
      type: String,
      default: '#f59e0b'
    },
    fontFamily: {
      type: String,
      default: 'Inter'
    }
  },
  template: {
    type: String,
    enum: ['modern', 'minimalist', 'widget'],
    default: 'modern'
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  academicConfig: {
    currentSession: {
      type: String,
      default: () => new Date().getFullYear().toString()
    },
    sessionStartMonth: {
      type: String,
      default: 'April'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    features: [{
      type: String
    }]
  },
  enabledModules: {
    students: { type: Boolean, default: true },
    teachers: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
    fees: { type: Boolean, default: true },
    notices: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    admissions: { type: Boolean, default: true },
    timetable: { type: Boolean, default: true },
    exams: { type: Boolean, default: false },
    library: { type: Boolean, default: false },
    transport: { type: Boolean, default: false },
    hostel: { type: Boolean, default: false }
  },
  customFields: [{
    fieldName: String,
    fieldType: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'checkbox']
    },
    options: [String],
    required: Boolean,
    appliesTo: {
      type: String,
      enum: ['student', 'teacher', 'both']
    }
  }],
  dashboardWidgets: {
    studentStats: { type: Boolean, default: true },
    teacherStats: { type: Boolean, default: true },
    classStats: { type: Boolean, default: true },
    feeStats: { type: Boolean, default: true },
    attendanceStats: { type: Boolean, default: true },
    recentNotices: { type: Boolean, default: true },
    upcomingEvents: { type: Boolean, default: false },
    quickActions: { type: Boolean, default: true },
  },
  settings: {
    allowParentAccess: { type: Boolean, default: true },
    autoAttendanceReminder: { type: Boolean, default: false },
    feeReminderDays: { type: Number, default: 7 },
    language: { type: String, default: 'en' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for tenant-based queries
schoolSchema.index({ tenantId: 1 });
schoolSchema.index({ subdomain: 1 });

module.exports = mongoose.model('School', schoolSchema);
