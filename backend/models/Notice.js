const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
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
  category: {
    type: String,
    enum: ['general', 'exam', 'holiday', 'event', 'urgent', 'academic'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  targetType: {
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'specific_class'],
    required: true
  },
  targetClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  targetSections: [String],
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  attachments: [{
    name: String,
    file: String
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
noticeSchema.index({ tenantId: 1, schoolId: 1 });
noticeSchema.index({ publishDate: -1 });
noticeSchema.index({ targetType: 1, targetClasses: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
