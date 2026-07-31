const Role = require('../models/Role');
const Permission = require('../models/Permission');

const roleScope = (req) => {
  if (req.user.role === 'super_admin') return {};
  return { tenantId: req.user.tenantId, schoolId: req.user.schoolId };
};

// @desc    Get all permissions catalog
// @route   GET /api/roles/permissions
// @access  Private
exports.getPermissions = async (req, res) => {
  try {
    const { category, module } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (module) filter.module = module;

    const permissions = await Permission.find(filter).sort({ category: 1, module: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all roles for tenant
// @route   GET /api/roles
// @access  Private
exports.getRoles = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role !== 'super_admin') {
      filter.$or = [{ isSystem: true }, { tenantId: req.user.tenantId, schoolId: req.user.schoolId }];
    }

    const roles = await Role.find(filter)
      .populate('permissions', 'code name module category')
      .sort({ isSystem: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private
exports.getRole = async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, ...roleScope(req) }).populate('permissions', 'code name module category');
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    res.status(200).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create role
// @route   POST /api/roles
// @access  Private
exports.createRole = async (req, res) => {
  try {
    const { name, slug, permissions, permissionCodes, description } = req.body;
    const tenantId = req.user.tenantId;
    const schoolId = req.user.schoolId;

    const existing = await Role.findOne({ slug, tenantId, schoolId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Role slug already exists for this tenant' });
    }

    const role = await Role.create({
      name,
      slug: slug.toLowerCase().trim(),
      description,
      tenantId,
      schoolId,
      permissionCodes: permissionCodes || [],
      permissions: permissions || [],
      createdBy: req.user._id
    });

    await role.populate('permissions', 'code name module category');

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private
exports.updateRole = async (req, res) => {
  try {
    const { name, permissions, permissionCodes, description, isActive } = req.body;

    const role = await Role.findOne({ _id: req.params.id, ...roleScope(req) });
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ success: false, error: 'System roles cannot be modified' });
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;
    if (permissionCodes) role.permissionCodes = permissionCodes;
    if (isActive !== undefined) role.isActive = isActive;
    role.updatedBy = req.user._id;

    await role.save();
    await role.populate('permissions', 'code name module category');

    res.status(200).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete role (soft)
// @route   DELETE /api/roles/:id
// @access  Private
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, ...roleScope(req) });
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ success: false, error: 'System roles cannot be deleted' });
    }

    role.isActive = false;
    role.updatedBy = req.user._id;
    await role.save();

    res.status(200).json({ success: true, message: 'Role deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
