const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true, trim: true },
  registrationNo: { type: String, required: true, trim: true },
  type: { type: String, enum: ['bus', 'van', 'car', 'other'], default: 'bus' },
  capacity: { type: Number, default: 50 },
  model: String,
  manufacturer: String,
  year: Number,
  gpsDeviceId: String,
  insuranceExpiry: Date,
  pollutionExpiry: Date,
  fitnessExpiry: Date,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

vehicleSchema.index({ tenantId: 1, schoolId: 1, registrationNo: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
