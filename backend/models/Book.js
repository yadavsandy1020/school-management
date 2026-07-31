const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  title: { type: String, required: true, trim: true },
  isbn: { type: String, trim: true },
  barcode: { type: String, trim: true, index: true },
  author: { type: String, required: true, trim: true },
  publisher: String,
  category: { type: String, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  language: { type: String, default: 'English' },
  edition: String,
  publicationYear: Number,
  quantity: { type: Number, default: 1 },
  available: { type: Number, default: 1 },
  rackNo: String,
  shelfNo: String,
  price: Number,
  description: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

bookSchema.index({ tenantId: 1, schoolId: 1, category: 1 });
bookSchema.index({ tenantId: 1, schoolId: 1, title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);
