const mongoose = require('mongoose');

const generatedDocumentSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },

  documentNo: { type: String, required: true, index: true },

  // certificate | marksheet | idcard | feeDocument | report | letter | salarySlip | admitCard
  documentType: {
    type: String,
    required: true,
    enum: ['certificate', 'marksheet', 'idcard', 'feeDocument', 'report', 'letter', 'salarySlip', 'admitCard'],
    index: true
  },

  templateStyle: { type: String, enum: ['standard', 'modern'], default: 'standard' },

  subType: { type: String, default: '' },
  design: { type: String, default: 'classic' },

  // References
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  academicSession: { type: String, default: '' },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentTemplate' },

  // Snapshot of template at generation time (so later edits don't change issued docs)
  templateSnapshot: {
    title: String,
    bodyText: String,
    footerText: String,
    layout: mongoose.Schema.Types.Mixed,
    styling: mongoose.Schema.Types.Mixed,
    marksheetColumns: mongoose.Schema.Types.Mixed,
    idCardFields: mongoose.Schema.Types.Mixed,
    signatures: [mongoose.Schema.Types.Mixed],
  },

  // Snapshot of all data used to render this document
  dataSnapshot: { type: mongoose.Schema.Types.Mixed },

  // For marksheets
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  examName: { type: String, default: '' },
  subjects: [{
    subjectName: String,
    maxMarks: Number,
    passingMarks: Number,
    theoryMarks: Number,
    practicalMarks: Number,
    obtainedMarks: Number,
    total: Number,
    grade: String,
    result: String,
  }],
  totalMarks: Number,
  obtainedTotal: Number,
  percentage: Number,
  overallGrade: String,
  overallResult: String,
  rank: Number,
  remarks: String,

  // For fee documents
  feeInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeInvoice' },

  // For salary slips
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },

  // For reports
  reportTitle: String,
  reportSubtitle: String,
  reportFilters: mongoose.Schema.Types.Mixed,
  reportColumns: [mongoose.Schema.Types.Mixed],
  reportRows: [mongoose.Schema.Types.Mixed],
  reportSummary: mongoose.Schema.Types.Mixed,
  reportOrientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },

  // Status
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'partially_paid', 'cancelled', 'void', 'duplicate', 'active'],
    default: 'active',
    index: true
  },
  voidReason: String,
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  voidedAt: Date,

  // QR Verification
  verificationToken: { type: String, index: true, unique: true, sparse: true },
  qrData: String,

  // Audit
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  regeneratedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedDocument' },

  // PDF storage (optional - can store base64 or file path)
  pdfPath: String,
}, { timestamps: true });

// Compound unique index on documentNo per tenant
generatedDocumentSchema.index({ tenantId: 1, schoolId: 1, documentNo: 1 }, { unique: true });
generatedDocumentSchema.index({ tenantId: 1, schoolId: 1, documentType: 1, status: 1 });
generatedDocumentSchema.index({ studentId: 1, documentType: 1 });

module.exports = mongoose.model('GeneratedDocument', generatedDocumentSchema);
