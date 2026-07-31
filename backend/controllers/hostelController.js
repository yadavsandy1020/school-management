const Hostel = require('../models/Hostel');
const HostelRoom = require('../models/HostelRoom');
const HostelAllocation = require('../models/HostelAllocation');
const HostelVisitor = require('../models/HostelVisitor');
const { getNextNumber } = require('../services/sequenceService');

const tenantFilter = (req) => ({ tenantId: req.user.tenantId, schoolId: req.user.schoolId });

exports.getHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find({ ...tenantFilter(req), isActive: true }).populate('warden', 'name').sort({ name: 1 });
    res.status(200).json({ success: true, data: hostels });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createHostel = async (req, res) => {
  try {
    const hostel = await Hostel.create({ ...req.body, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: hostel });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: hostel });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteHostel = async (req, res) => {
  try {
    await Hostel.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Hostel deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getRooms = async (req, res) => {
  try {
    const { hostelId } = req.query;
    const filter = { ...tenantFilter(req), isActive: true };
    if (hostelId) filter.hostelId = hostelId;
    const rooms = await HostelRoom.find(filter).populate('hostelId', 'name').sort({ roomNo: 1 });
    res.status(200).json({ success: true, data: rooms });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createRoom = async (req, res) => {
  try {
    const data = { ...req.body, ...tenantFilter(req), createdBy: req.user._id };
    if (!data.roomNo) {
      data.roomNo = await getNextNumber({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        entityType: 'hostelRoom'
      });
    }
    const room = await HostelRoom.create(data);
    await Hostel.findOneAndUpdate({ _id: room.hostelId, ...tenantFilter(req) }, { $inc: { totalRooms: 1, totalBeds: room.capacity } });
    res.status(201).json({ success: true, data: room });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateRoom = async (req, res) => {
  try {
    const old = await HostelRoom.findOne({ _id: req.params.id, ...tenantFilter(req) });
    const room = await HostelRoom.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (old && room) {
      await Hostel.findOneAndUpdate({ _id: room.hostelId, ...tenantFilter(req) }, { $inc: { totalBeds: room.capacity - old.capacity } });
    }
    res.status(200).json({ success: true, data: room });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await HostelRoom.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id }, { new: true });
    await Hostel.findOneAndUpdate({ _id: room.hostelId, ...tenantFilter(req) }, { $inc: { totalRooms: -1, totalBeds: -room.capacity } });
    res.status(200).json({ success: true, message: 'Room deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getAllocations = async (req, res) => {
  try {
    const allocations = await HostelAllocation.find({ ...tenantFilter(req), isActive: true })
      .populate('studentId', 'name studentDetails.admissionNo')
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNo')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: allocations });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createAllocation = async (req, res) => {
  try {
    const data = { ...req.body, ...tenantFilter(req), createdBy: req.user._id };
    if (!data.allocationNumber) {
      data.allocationNumber = await getNextNumber({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        entityType: 'hostelAllocation'
      });
    }
    const allocation = await HostelAllocation.create(data);
    await HostelRoom.findOneAndUpdate({ _id: allocation.roomId, ...tenantFilter(req) }, { $inc: { occupied: 1 } });
    res.status(201).json({ success: true, data: allocation });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateAllocation = async (req, res) => {
  try {
    const allocation = await HostelAllocation.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: allocation });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteAllocation = async (req, res) => {
  try {
    const allocation = await HostelAllocation.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id }, { new: true });
    await HostelRoom.findOneAndUpdate({ _id: allocation.roomId, ...tenantFilter(req) }, { $inc: { occupied: -1 } });
    res.status(200).json({ success: true, message: 'Allocation deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getVisitors = async (req, res) => {
  try {
    const visitors = await HostelVisitor.find({ ...tenantFilter(req) })
      .populate('studentId', 'name studentDetails.admissionNo')
      .populate('hostelId', 'name')
      .sort({ inTime: -1 });
    res.status(200).json({ success: true, data: visitors });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createVisitor = async (req, res) => {
  try {
    const data = { ...req.body, ...tenantFilter(req), createdBy: req.user._id };
    if (!data.visitorNumber) {
      data.visitorNumber = await getNextNumber({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        entityType: 'hostelVisitor'
      });
    }
    const visitor = await HostelVisitor.create(data);
    res.status(201).json({ success: true, data: visitor });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateVisitorOutTime = async (req, res) => {
  try {
    const visitor = await HostelVisitor.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { outTime: new Date(), updatedBy: req.user._id }, { new: true });
    res.status(200).json({ success: true, data: visitor });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};
