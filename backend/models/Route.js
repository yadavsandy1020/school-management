const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: { type: String, trim: true },
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, default: '' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  stops: [{
    name: { type: String, required: true },
    sequence: { type: Number, default: 0 },
    pickupTime: String,
    dropTime: String,
    latitude: Number,
    longitude: Number,
    fare: { type: Number, default: 0 }
  }],
  totalDistance: Number,
  fare: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

routeSchema.index({ tenantId: 1, schoolId: 1, name: 1 });

module.exports = mongoose.model('Route', routeSchema);
