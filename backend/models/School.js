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
  shortName: {
    type: String
  },
  subdomain: {
    type: String,
    unique: true,
    lowercase: true
  },
  motto: String,
  affiliation: String,
  affiliationNumber: String,
  schoolCode: String,
  registrationNumber: String,
  udiseCode: String,
  board: {
    type: String,
    enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other', ''],
    default: ''
  },
  academicSession: String,
  financialYear: String,

  logo: String,
  favicon: String,
  assets: {
    principalSignature: String,
    schoolSeal: String,
    headerBackground: String,
    footerImage: String
  },

  theme: {
    mode: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
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
    enum: ['modern', 'minimalist', 'classic'],
    default: 'modern'
  },

  address: {
    street: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },

  contact: {
    phone: String,
    alternatePhone: String,
    email: String,
    website: String,
    officePhone: String,
    officeEmail: String
  },

  officials: {
    principalName: String,
    administratorName: String,
    officeContact: String,
    officeEmail: String
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

  documentSettings: {
    // ─── Template Selection ───
    defaultTemplate: { type: String, enum: ['standard', 'modern'], default: 'standard' },
    templateOverrides: {
      feeReceipt: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      feeInvoice: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      reportCard: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      transferCertificate: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      bonafideCertificate: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      studentIdCard: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      employeeIdCard: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      admitCard: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      salarySlip: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      notice: { type: String, enum: ['', 'standard', 'modern'], default: '' },
      report: { type: String, enum: ['', 'standard', 'modern'], default: '' },
    },

    // ─── Header ───
    header: {
      style: { type: String, enum: ['standard', 'compact', 'modern', 'none'], default: 'standard' },
      showLogo: { type: Boolean, default: true },
      showName: { type: Boolean, default: true },
      showShortName: { type: Boolean, default: false },
      showMotto: { type: Boolean, default: false },
      showBoard: { type: Boolean, default: true },
      showAffiliationNumber: { type: Boolean, default: true },
      showSchoolCode: { type: Boolean, default: false },
      showUdiseCode: { type: Boolean, default: false },
      showRegistrationNumber: { type: Boolean, default: false },
      showAddress: { type: Boolean, default: true },
      showContact: { type: Boolean, default: true },
      showWebsite: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: true },
      alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' }
    },

    // ─── Footer ───
    footer: {
      style: { type: String, enum: ['standard', 'compact', 'modern', 'none'], default: 'standard' },
      showMotto: { type: Boolean, default: false },
      showPoweredBy: { type: Boolean, default: true },
      customText: String,
      disclaimer: String,
      showContact: { type: Boolean, default: false },
      showWebsite: { type: Boolean, default: false },
      showPageNumber: { type: Boolean, default: true },
      showGeneratedDate: { type: Boolean, default: true },
      showGeneratedBy: { type: Boolean, default: false },
      computerGeneratedText: { type: String, default: 'This is a computer-generated document.' },
      showQrCode: { type: Boolean, default: false },
      alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' }
    },

    // ─── Signatures ───
    signatures: {
      principal: { name: String, title: { type: String, default: 'Principal' }, image: String, show: { type: Boolean, default: true } },
      accountant: { name: String, title: { type: String, default: 'Accountant' }, image: String, show: { type: Boolean, default: false } },
      classTeacher: { name: String, title: { type: String, default: 'Class Teacher' }, image: String, show: { type: Boolean, default: false } },
      authorizedSignatory: { name: String, title: { type: String, default: 'Authorized Signatory' }, image: String, show: { type: Boolean, default: false } },
    },

    // ─── Seal ───
    seal: {
      show: { type: Boolean, default: true },
      image: String,
      opacity: { type: Number, default: 0.3 },
      position: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
    },

    // ─── Printing ───
    printing: {
      paperSize: { type: String, enum: ['A4', 'A5'], default: 'A4' },
      orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
      marginTop: { type: Number, default: 40 },
      marginBottom: { type: Number, default: 40 },
      marginLeft: { type: Number, default: 40 },
      marginRight: { type: Number, default: 40 },
      receiptSize: { type: String, enum: ['A5', 'A4', 'halfA4'], default: 'A5' },
      idCardLayout: { type: String, enum: ['single', 'double'], default: 'double' },
    },

    // ─── Verification ───
    verification: {
      qrEnabled: { type: Boolean, default: false },
      verificationUrl: String,
      documentNumbering: { type: Boolean, default: true },
    },

    // ─── Watermark ───
    watermark: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: '' }
    }
  },

  documentTemplates: {
    feeReceipt: { header: String, footer: String, notes: String },
    invoice: { header: String, footer: String, notes: String },
    studentIdCard: { header: String, footer: String, notes: String },
    employeeIdCard: { header: String, footer: String, notes: String },
    bonafideCertificate: { header: String, body: String, footer: String },
    characterCertificate: { header: String, body: String, footer: String },
    transferCertificate: { header: String, body: String, footer: String },
    reportCard: { header: String, footer: String, notes: String },
    progressCard: { header: String, footer: String, notes: String },
    admitCard: { header: String, footer: String, notes: String },
    hallTicket: { header: String, footer: String, notes: String },
    salarySlip: { header: String, footer: String, notes: String },
    appointmentLetter: { header: String, body: String, footer: String },
    experienceLetter: { header: String, body: String, footer: String },
    leavingCertificate: { header: String, body: String, footer: String },
    admissionForm: { header: String, footer: String, notes: String },
    notice: { header: String, footer: String, notes: String },
    circular: { header: String, footer: String, notes: String },
    homework: { header: String, footer: String, notes: String },
    timetable: { header: String, footer: String, notes: String },
    libraryReceipt: { header: String, footer: String, notes: String },
    transportReceipt: { header: String, footer: String, notes: String },
    hostelReceipt: { header: String, footer: String, notes: String }
  },

  autoNumbering: {
    student: { prefix: { type: String, default: 'STU' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    teacher: { prefix: { type: String, default: 'EMP' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    employee: { prefix: { type: String, default: 'EMP' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    admission: { prefix: { type: String, default: 'ADM' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    parent: { prefix: { type: String, default: 'PAR' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    book: { prefix: { type: String, default: 'BOOK' }, numberLength: { type: Number, default: 6 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: false }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'never' } },
    libraryIssue: { prefix: { type: String, default: 'LIB' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    invoice: { prefix: { type: String, default: 'INV' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    feeReceipt: { prefix: { type: String, default: 'REC' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    expense: { prefix: { type: String, default: 'EXP' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    salarySlip: { prefix: { type: String, default: 'SAL' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    purchaseOrder: { prefix: { type: String, default: 'PO' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    transportRoute: { prefix: { type: String, default: 'RT' }, numberLength: { type: Number, default: 3 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: false }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'never' } },
    hostelRoom: { prefix: { type: String, default: 'RM' }, numberLength: { type: Number, default: 3 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: false }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'never' } },
    payment: { prefix: { type: String, default: 'PAY' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    notice: { prefix: { type: String, default: 'NTC' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    exam: { prefix: { type: String, default: 'EXM' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } },
    class: { prefix: { type: String, default: 'CLS' }, numberLength: { type: Number, default: 5 }, startingNumber: { type: Number, default: 1 }, includeAcademicYear: { type: Boolean, default: true }, includeFinancialYear: { type: Boolean, default: false }, includeBranchCode: { type: Boolean, default: false }, includeSchoolCode: { type: Boolean, default: false }, separator: { type: String, default: '-' }, resetPolicy: { type: String, default: 'academicYear' } }
  },

  // Subscription, licensing, and feature flags are managed in separate models:
  // Subscription, License, FeatureFlag — never combine them here.

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

schoolSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model('School', schoolSchema);
