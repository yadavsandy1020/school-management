const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  module: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['students', 'teachers', 'academic', 'attendance', 'fees', 'finance', 'hrms', 'library', 'transport', 'hostel', 'documents', 'communication', 'settings', 'users', 'reports', 'dashboard', 'system']
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

permissionSchema.index({ module: 1, category: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
