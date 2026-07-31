const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema({
  issueNumber: { type: String, trim: true },
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: Date,
  status: { type: String, enum: ['issued', 'returned', 'lost', 'reserved'], default: 'issued', index: true },
  fineAmount: { type: Number, default: 0 },
  finePaid: { type: Boolean, default: false },
  notes: String,
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

bookIssueSchema.index({ tenantId: 1, schoolId: 1, status: 1 });
bookIssueSchema.index({ bookId: 1, status: 1 });

module.exports = mongoose.model('BookIssue', bookIssueSchema);
