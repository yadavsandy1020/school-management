const CalendarEvent = require('../models/CalendarEvent');
const Message = require('../models/Message');

const tenantFilter = (req) => ({ tenantId: req.user.tenantId, schoolId: req.user.schoolId });

exports.getEvents = async (req, res) => {
  try {
    const { start, end, type } = req.query;
    const filter = { ...tenantFilter(req), isActive: true };
    if (start && end) filter.startDate = { $gte: new Date(start), $lte: new Date(end) };
    if (type) filter.type = type;

    const events = await CalendarEvent.find(filter).sort({ startDate: 1 });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: event });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteEvent = async (req, res) => {
  try {
    await CalendarEvent.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Event deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getMessages = async (req, res) => {
  try {
    const filter = { ...tenantFilter(req), isActive: true };
    if (req.user.role !== 'super_admin' && req.user.role !== 'school_admin') {
      filter.$or = [
        { recipients: req.user._id },
        { recipientRoles: req.user.role },
        { recipientRoles: 'all' }
      ];
    }
    const messages = await Message.find(filter)
      .populate('senderId', 'name role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const message = await Message.create({ ...req.body, ...tenantFilter(req), senderId: req.user._id, createdBy: req.user._id });
    res.status(201).json({ success: true, data: message });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, ...tenantFilter(req) },
      { $push: { isReadBy: { userId: req.user._id, readAt: new Date() } } },
      { new: true }
    );
    res.status(200).json({ success: true, data: message });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};
