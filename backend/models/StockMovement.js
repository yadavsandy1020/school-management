const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true, index: true },
  type: { type: String, enum: ['in', 'out', 'adjustment', 'return'], required: true },
  quantity: { type: Number, required: true },
  reference: String,
  notes: String,
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
