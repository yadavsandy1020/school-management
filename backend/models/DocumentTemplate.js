const mongoose = require('mongoose');

const documentTemplateSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },

  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },

  // certificate | marksheet | idcard | feeDocument | report | letter | salarySlip | admitCard
  documentType: {
    type: String,
    required: true,
    enum: ['certificate', 'marksheet', 'idcard', 'feeDocument', 'report', 'letter', 'salarySlip', 'admitCard'],
    index: true
  },

  // standard | modern — which template design to use
  templateStyle: {
    type: String,
    enum: ['standard', 'modern'],
    default: 'standard'
  },

  // For certificates: tc, bonafide, character, etc.
  // For marksheets: standard, detailed, primary, consolidated
  // For idcards: standard, withQR
  // For feeDocuments: feeReceipt, feeStatement, feeDueNotice, noDues
  subType: { type: String, default: '', trim: true },

  // classic | modern | minimal | premium | colorful | kids | compact | formal
  // (kept for backward compat; templateStyle is the primary style selector)
  design: { type: String, default: 'classic', trim: true },

  // Template content with dynamic placeholders
  title: { type: String, default: '' },
  bodyText: { type: String, default: '' },
  footerText: { type: String, default: '' },

  // Layout configuration
  layout: {
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    pageSize: { type: String, default: 'A4' },
    marginTop: { type: Number, default: 40 },
    marginBottom: { type: Number, default: 40 },
    marginLeft: { type: Number, default: 40 },
    marginRight: { type: Number, default: 40 },
  },

  // Styling
  styling: {
    primaryColor: { type: String, default: '#1e40af' },
    secondaryColor: { type: String, default: '#3b82f6' },
    accentColor: { type: String, default: '#f59e0b' },
    fontFamily: { type: String, default: 'Helvetica' },
    titleFontSize: { type: Number, default: 18 },
    bodyFontSize: { type: Number, default: 11 },
    showBorder: { type: Boolean, default: true },
    showLogo: { type: Boolean, default: true },
    showWatermark: { type: Boolean, default: false },
    watermarkText: { type: String, default: '' },
  },

  // For marksheets: which columns to show
  marksheetColumns: {
    showTheory: { type: Boolean, default: false },
    showPractical: { type: Boolean, default: false },
    showMaxMarks: { type: Boolean, default: true },
    showPassMarks: { type: Boolean, default: false },
    showGrade: { type: Boolean, default: true },
    showPercentage: { type: Boolean, default: true },
    showRank: { type: Boolean, default: false },
    showRemarks: { type: Boolean, default: false },
  },

  // For ID cards: which fields to show on front/back
  idCardFields: {
    front: {
      showDOB: { type: Boolean, default: false },
      showBloodGroup: { type: Boolean, default: false },
      showParentPhone: { type: Boolean, default: true },
      showAddress: { type: Boolean, default: false },
      showQRCode: { type: Boolean, default: false },
      showSession: { type: Boolean, default: true },
    },
    back: {
      showSchoolAddress: { type: Boolean, default: true },
      showContact: { type: Boolean, default: true },
      showInstructions: { type: Boolean, default: true },
      instructions: { type: String, default: 'This card is property of the school. If found, please return to the school office.' },
      showSignature: { type: Boolean, default: true },
    }
  },

  // Signature configuration
  signatures: [{
    label: { type: String, default: 'Principal' },
    variableName: { type: String, default: 'principalName' },
    position: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
  }],

  // Certificate numbering config (per template)
  numbering: {
    prefix: { type: String, default: '' },
    numberLength: { type: Number, default: 4 },
    includeAcademicYear: { type: Boolean, default: true },
    separator: { type: String, default: '/' },
  },

  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

documentTemplateSchema.index({ tenantId: 1, schoolId: 1, documentType: 1, subType: 1, templateStyle: 1 });
documentTemplateSchema.index({ tenantId: 1, schoolId: 1, code: 1 });

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
