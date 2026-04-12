const School = require('../models/School');
const upload = require('../middleware/upload');

// @desc    Update school theme
// @route   PUT /api/customization/theme
// @access  Private (School Admin)
exports.updateTheme = async (req, res) => {
  try {
    const { primaryColor, secondaryColor, accentColor, fontFamily } = req.body;

    const school = await School.findById(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    school.theme = {
      primaryColor: primaryColor || school.theme.primaryColor,
      secondaryColor: secondaryColor || school.theme.secondaryColor,
      accentColor: accentColor || school.theme.accentColor,
      fontFamily: fontFamily || school.theme.fontFamily
    };

    await school.save();

    res.status(200).json({
      success: true,
      theme: school.theme
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update school template
// @route   PUT /api/customization/template
// @access  Private (School Admin)
exports.updateTemplate = async (req, res) => {
  try {
    const { template } = req.body;

    const school = await School.findById(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    if (!['modern', 'classic', 'minimal'].includes(template)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid template. Must be modern, classic, or minimal'
      });
    }

    school.template = template;
    await school.save();

    res.status(200).json({
      success: true,
      template: school.template
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Upload school logo
// @route   POST /api/customization/logo
// @access  Private (School Admin)
exports.uploadLogo = async (req, res) => {
  try {
    upload.single('logo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const school = await School.findById(req.user.schoolId);

      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'School not found'
        });
      }

      school.logo = `/uploads/${req.file.filename}`;
      await school.save();

      res.status(200).json({
        success: true,
        logo: school.logo
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update enabled modules
// @route   PUT /api/customization/modules
// @access  Private (School Admin)
exports.updateModules = async (req, res) => {
  try {
    const { enabledModules } = req.body;

    const school = await School.findById(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    school.enabledModules = { ...school.enabledModules, ...enabledModules };
    await school.save();

    res.status(200).json({
      success: true,
      enabledModules: school.enabledModules
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add custom field
// @route   POST /api/customization/custom-fields
// @access  Private (School Admin)
exports.addCustomField = async (req, res) => {
  try {
    const { fieldName, fieldType, options, required, appliesTo } = req.body;

    const school = await School.findById(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    const customField = {
      fieldName,
      fieldType,
      options: options || [],
      required: required || false,
      appliesTo
    };

    school.customFields.push(customField);
    await school.save();

    res.status(201).json({
      success: true,
      customFields: school.customFields
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Remove custom field
// @route   DELETE /api/customization/custom-fields/:fieldId
// @access  Private (School Admin)
exports.removeCustomField = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    school.customFields = school.customFields.filter(
      field => field._id.toString() !== req.params.fieldId
    );
    await school.save();

    res.status(200).json({
      success: true,
      customFields: school.customFields
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update school settings
// @route   PUT /api/customization/settings
// @access  Private (School Admin)
exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    const school = await School.findById(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    school.settings = { ...school.settings, ...settings };
    await school.save();

    res.status(200).json({
      success: true,
      settings: school.settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get school customization
// @route   GET /api/customization
// @access  Private
exports.getCustomization = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      customization: {
        theme: school.theme,
        template: school.template,
        logo: school.logo,
        enabledModules: school.enabledModules,
        customFields: school.customFields,
        settings: school.settings
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
