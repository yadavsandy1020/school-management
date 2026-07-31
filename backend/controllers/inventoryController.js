const InventoryItem = require('../models/InventoryItem');
const StockMovement = require('../models/StockMovement');

const tenantFilter = (req) => ({ tenantId: req.user.tenantId, schoolId: req.user.schoolId });

exports.getItems = async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    const filter = { ...tenantFilter(req), isActive: true };
    if (category) filter.category = category;
    if (lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };

    const items = await InventoryItem.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createItem = async (req, res) => {
  try {
    const item = await InventoryItem.create({ ...req.body, ...tenantFilter(req), createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: item });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.deleteItem = async (req, res) => {
  try {
    await InventoryItem.findOneAndUpdate({ _id: req.params.id, ...tenantFilter(req) }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Item deactivated' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getMovements = async (req, res) => {
  try {
    const { itemId } = req.query;
    const filter = { ...tenantFilter(req) };
    if (itemId) filter.itemId = itemId;
    const movements = await StockMovement.find(filter).populate('itemId', 'name code').sort({ date: -1 });
    res.status(200).json({ success: true, count: movements.length, data: movements });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.recordMovement = async (req, res) => {
  try {
    const { itemId, type, quantity, reference, notes } = req.body;
    const item = await InventoryItem.findOne({ _id: itemId, ...tenantFilter(req) });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    const movement = await StockMovement.create({
      ...tenantFilter(req),
      itemId,
      type,
      quantity,
      reference,
      notes,
      createdBy: req.user._id
    });

    if (type === 'in' || type === 'return') item.quantity += quantity;
    if (type === 'out') item.quantity = Math.max(0, item.quantity - quantity);
    if (type === 'adjustment') item.quantity = quantity;
    item.updatedBy = req.user._id;
    await item.save();

    res.status(201).json({ success: true, data: movement, item });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await InventoryItem.distinct('category', { ...tenantFilter(req), isActive: true });
    res.status(200).json({ success: true, data: categories });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};
