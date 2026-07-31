const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['boys', 'girls', 'staff', 'mixed'], required: true },
  address: String,
  warden: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalRooms: { type: Number, default: 0 },
  totalBeds: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

hostelSchema.index({ tenantId: 1, schoolId: 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
