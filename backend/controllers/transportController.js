const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const TransportAllocation = require('../models/TransportAllocation');
const { getNextNumber } = require('../services/sequenceService');

const tenantFilter = (req) => ({
  tenantId: req.user.tenantId,
  schoolId: req.user.schoolId
});

const sanitizeObjectIdFields = (body, fields) => {
  const cleaned = { ...body };
  fields.forEach(f => {
    if (f in cleaned && (cleaned[f] === '' || cleaned[f] === 'null' || cleaned[f] === undefined)) {
      cleaned[f] = null;
    }
  });
  return cleaned;
};

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ ...tenantFilter(req), isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: vehicles });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteVehicle = async (req, res) => {
  try {
    await Vehicle.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Vehicle deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ ...tenantFilter(req), isActive: true }).populate('assignedVehicle', 'name registrationNo').sort({ name: 1 });
    res.status(200).json({ success: true, data: drivers });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createDriver = async (req, res) => {
  try {
    const data = sanitizeObjectIdFields(req.body, ['assignedVehicle']);
    const driver = await Driver.create({ ...data, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: driver });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateDriver = async (req, res) => {
  try {
    const data = sanitizeObjectIdFields(req.body, ['assignedVehicle']);
    const driver = await Driver.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...data, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: driver });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteDriver = async (req, res) => {
  try {
    await Driver.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Driver deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ ...tenantFilter(req), isActive: true })
      .populate('vehicleId', 'name registrationNo')
      .populate('driverId', 'name phone')
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: routes });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createRoute = async (req, res) => {
  try {
    const data = sanitizeObjectIdFields(req.body, ['vehicleId', 'driverId']);
    Object.assign(data, tenantFilter(req), { createdBy: req.user._id });
    if (!data.routeNumber) {
      data.routeNumber = await getNextNumber({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        entityType: 'transportRoute'
      });
    }
    if (!data.code) data.code = data.routeNumber;
    const route = await Route.create(data);
    res.status(201).json({ success: true, data: route });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateRoute = async (req, res) => {
  try {
    const data = sanitizeObjectIdFields(req.body, ['vehicleId', 'driverId']);
    const route = await Route.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...data, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: route });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteRoute = async (req, res) => {
  try {
    await Route.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Route deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getAllocations = async (req, res) => {
  try {
    const allocations = await TransportAllocation.find({ ...tenantFilter(req), isActive: true })
      .populate('studentId', 'admissionNo rollNo personalInfo.firstName personalInfo.lastName classId section')
      .populate({ path: 'routeId', populate: { path: 'vehicleId', select: 'name registrationNo capacity' } })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: allocations });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getStudentAllocation = async (req, res) => {
  try {
    const allocation = await TransportAllocation.findOne({
      ...tenantFilter(req),
      studentId: req.params.studentId,
      isActive: true
    })
      .populate('studentId', 'admissionNo personalInfo.firstName personalInfo.lastName')
      .populate({ path: 'routeId', populate: { path: 'vehicleId', select: 'name registrationNo capacity type' } });

    if (!allocation) {
      return res.status(404).json({ success: false, error: 'No active transport allocation found for this student' });
    }
    res.status(200).json({ success: true, data: allocation });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createAllocation = async (req, res) => {
  try {
    const { studentId, routeId } = req.body;

    if (!studentId || !routeId) {
      return res.status(400).json({ success: false, error: 'Student and Route are required' });
    }

    const existing = await TransportAllocation.findOne({
      ...tenantFilter(req),
      studentId,
      isActive: true
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Student already has an active transport allocation. Deactivate it first to assign a new route.' });
    }

    const route = await Route.findOne({ _id: routeId, ...tenantFilter(req), isActive: true });
    if (!route) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    if (route.vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: route.vehicleId, ...tenantFilter(req), isActive: true });
      if (vehicle) {
        const allocatedCount = await TransportAllocation.countDocuments({
          routeId,
          ...tenantFilter(req),
          isActive: true
        });
        if (allocatedCount >= vehicle.capacity) {
          return res.status(400).json({ success: false, error: `Vehicle capacity full (${vehicle.capacity}). ${allocatedCount} students already allocated.` });
        }
      }
    }

    // Determine fare: explicit fare > stop-specific fare > route default fare
    let fare = req.body.fare !== undefined ? Number(req.body.fare) : (route.fare || 0);
    const stopName = req.body.stopName || '';
    if (stopName && route.stops && route.stops.length > 0) {
      const stop = route.stops.find(s => s.name === stopName);
      if (stop && stop.fare !== undefined && stop.fare > 0) {
        fare = stop.fare;
      }
    }

    const allocation = await TransportAllocation.create({
      ...tenantFilter(req),
      studentId,
      routeId,
      stopName,
      pickupStop: req.body.pickupStop || '',
      dropStop: req.body.dropStop || '',
      fare,
      createdBy: req.user._id
    });

    const populated = await TransportAllocation.findById(allocation._id)
      .populate('studentId', 'admissionNo personalInfo.firstName personalInfo.lastName')
      .populate({ path: 'routeId', populate: { path: 'vehicleId', select: 'name registrationNo capacity' } });

    res.status(201).json({ success: true, data: populated });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateAllocation = async (req, res) => {
  try {
    const data = { ...req.body, updatedBy: req.user._id };
    delete data.tenantId;
    delete data.schoolId;
    delete data._id;
    delete data.__v;
    delete data.createdAt;
    delete data.updatedAt;

    const allocation = await TransportAllocation.findOneAndUpdate(
      { _id: req.params.id, ...tenantFilter(req) },
      data,
      { new: true, runValidators: true }
    ).populate('studentId', 'admissionNo personalInfo.firstName personalInfo.lastName')
      .populate({ path: 'routeId', populate: { path: 'vehicleId', select: 'name registrationNo capacity' } });

    if (!allocation) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }
    res.status(200).json({ success: true, data: allocation });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteAllocation = async (req, res) => {
  try {
    await TransportAllocation.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Allocation deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};
