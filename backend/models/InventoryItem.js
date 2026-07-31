const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  category: { type: String, index: true },
  description: String,
  unit: { type: String, default: 'pcs' },
  quantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  unitPrice: { type: Number, default: 0 },
  supplier: String,
  location: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

inventoryItemSchema.index({ tenantId: 1, schoolId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
