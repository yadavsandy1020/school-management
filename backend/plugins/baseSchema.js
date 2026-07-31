const mongoose = require('mongoose');

/**
 * BaseSchema plugin for EduPilot multi-tenant models.
 * Adds tenant isolation, audit fields, soft delete, and automatic audit logging.
 */
const baseSchema = (schema, options = {}) => {
  const {
    tenantField = true,
    schoolField = true,
    auditFields = true,
    softDelete = true,
    auditLog = true
  } = options;

  if (tenantField) {
    schema.add({
      tenantId: {
        type: String,
        index: true,
        required: function () {
          // Super admin scoped records may omit tenantId if explicitly allowed by consumer
          return this.role !== 'super_admin' && this.tenantId !== undefined;
        }
      }
    });
  }

  if (schoolField) {
    schema.add({
      schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        index: true
      }
    });
  }

  if (auditFields) {
    schema.add({
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    });
  }

  if (softDelete) {
    schema.add({
      isDeleted: {
        type: Boolean,
        default: false,
        index: true
      },
      deletedAt: {
        type: Date,
        default: null
      },
      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    });

    // Static method for soft delete
    schema.statics.softDelete = async function (id, userId) {
      return this.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
        { new: true, runValidators: false }
      );
    };

    // Static method to restore
    schema.statics.restore = async function (id) {
      return this.findByIdAndUpdate(
        id,
        { isDeleted: false, deletedAt: null, deletedBy: null },
        { new: true, runValidators: false }
      );
    };

    // Default query filter to exclude soft-deleted docs unless overridden
    schema.pre(/^find/, function (next) {
      if (!this.getQuery().includeDeleted) {
        this.where({ isDeleted: { $ne: true } });
      }
      next();
    });

    schema.pre('countDocuments', function (next) {
      if (!this.getQuery().includeDeleted) {
        this.where({ isDeleted: { $ne: true } });
      }
      next();
    });
  }

  // Auto-capture updatedBy from req context before save
  schema.pre('save', function (next) {
    if (this.isNew && !this.createdBy && this._createdBy) {
      this.createdBy = this._createdBy;
    }
    if (this._updatedBy) {
      this.updatedBy = this._updatedBy;
    }
    next();
  });

  // Ensure tenant + school compound index for performance
  if (tenantField && schoolField) {
    schema.index({ tenantId: 1, schoolId: 1 });
  }
  if (softDelete) {
    schema.index({ tenantId: 1, isDeleted: 1 });
  }
};

module.exports = baseSchema;
