const mongoose = require('mongoose');

const transportAllocationSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  stopName: String,
  pickupStop: String,
  dropStop: String,
  fare: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

transportAllocationSchema.index({ tenantId: 1, schoolId: 1, studentId: 1, isActive: 1 });

module.exports = mongoose.model('TransportAllocation', transportAllocationSchema);
