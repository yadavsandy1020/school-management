const mongoose = require('mongoose');

const hostelRoomSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
  roomNo: { type: String, required: true },
  floor: String,
  roomType: { type: String, enum: ['single', 'double', 'triple', 'dormitory'], default: 'double' },
  capacity: { type: Number, default: 2 },
  occupied: { type: Number, default: 0 },
  amenities: [String],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

hostelRoomSchema.index({ tenantId: 1, schoolId: 1, hostelId: 1, roomNo: 1 }, { unique: true });

module.exports = mongoose.model('HostelRoom', hostelRoomSchema);
