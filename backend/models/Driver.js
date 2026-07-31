const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: String,
  licenseNo: { type: String, required: true },
  licenseExpiry: Date,
  address: String,
  assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

driverSchema.index({ tenantId: 1, schoolId: 1 });

module.exports = mongoose.model('Driver', driverSchema);
