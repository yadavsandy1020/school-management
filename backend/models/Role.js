const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  tenantId: {
    type: String,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    index: true
  },
  description: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  permissionCodes: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

roleSchema.index({ tenantId: 1, slug: 1 }, { unique: true, sparse: true });
roleSchema.index({ tenantId: 1, isActive: 1 });

// Resolve permission codes from populated permissions or stored codes
roleSchema.methods.hasPermission = function (permissionCode) {
  const codes = this.permissionCodes || [];
  if (codes.includes(permissionCode) || codes.includes('*')) return true;
  if (this.permissions && this.permissions.length) {
    return this.permissions.some(
      p => p.code === permissionCode || p.code === '*'
    );
  }
  return false;
};

module.exports = mongoose.model('Role', roleSchema);
