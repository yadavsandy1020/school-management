const mongoose = require('mongoose');

const hostelAllocationSchema = new mongoose.Schema({
  allocationNumber: { type: String, trim: true },
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelRoom', required: true },
  bedNo: String,
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromDate: { type: Date, default: Date.now },
  toDate: Date,
  fees: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

hostelAllocationSchema.index({ tenantId: 1, schoolId: 1, studentId: 1 });

module.exports = mongoose.model('HostelAllocation', hostelAllocationSchema);
