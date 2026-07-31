const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  recipientRoles: [{ type: String }],
  subject: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, enum: ['announcement', 'message', 'notice', 'alert'], default: 'message' },
  isReadBy: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: Date }],
  attachments: [String],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

messageSchema.index({ tenantId: 1, schoolId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
