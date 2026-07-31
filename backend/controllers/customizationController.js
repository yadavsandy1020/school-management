const School = require('../models/School');
const upload = require('../middleware/upload');
const DocumentEngineOrchestrator = require('../services/documentEngines');
const documentEngine = new DocumentEngineOrchestrator();
const featureFlagService = require('../services/featureFlagService');

// @desc    Update school theme
// @route   PUT /api/customization/theme
// @access  Private (School Admin)
exports.updateTheme = async (req, res) => {
  try {
    const { mode, primaryColor, secondaryColor, accentColor, fontFamily } = req.body;

    const school = await School.findById(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    school.theme = {
      mode: mode || school.theme.mode,
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

    if (!['modern', 'minimalist', 'classic'].includes(template)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid template. Must be modern, minimalist, or classic'
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

      const filePath = `/${req.file.path.replace(/\\/g, '/')}`;
      school.logo = filePath;
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

    const updates = [];
    for (const [moduleName, enabled] of Object.entries(enabledModules)) {
      const featureCode = moduleName.toUpperCase();
      const status = enabled ? 'enabled' : 'disabled';
      const flag = await featureFlagService.setFeatureFlag(
        school.tenantId,
        school._id,
        featureCode,
        status,
        'manual',
        req.user._id
      );
      updates.push(flag);
    }

    const features = await featureFlagService.resolveTenantFeatures(school.tenantId, school._id);

    res.status(200).json({
      success: true,
      enabledModules: features,
      updated: updates.length
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
        name: school.name,
        shortName: school.shortName,
        motto: school.motto,
        affiliation: school.affiliation,
        affiliationNumber: school.affiliationNumber,
        schoolCode: school.schoolCode,
        registrationNumber: school.registrationNumber,
        udiseCode: school.udiseCode,
        board: school.board,
        academicSession: school.academicSession,
        financialYear: school.financialYear,
        logo: school.logo,
        favicon: school.favicon,
        assets: school.assets,
        address: school.address,
        contact: school.contact,
        officials: school.officials,
        theme: school.theme,
        template: school.template,
        documentSettings: school.documentSettings,
        documentTemplates: school.documentTemplates,
        autoNumbering: school.autoNumbering,
        enabledModules: await featureFlagService.resolveTenantFeatures(school.tenantId, school._id),
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

const setNested = (obj, path, value) => {
  const keys = path.split('.');
  let target = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) target[keys[i]] = {};
    target = target[keys[i]];
  }
  target[keys[keys.length - 1]] = value;
};

// @desc    Update school branding and contact details
// @route   PUT /api/customization/branding
// @access  Private (School Admin)
exports.updateBranding = async (req, res) => {
  try {
    const {
      name, shortName, motto, affiliation, affiliationNumber, schoolCode,
      registrationNumber, udiseCode, board, academicSession, financialYear,
      address, contact, officials
    } = req.body;

    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    if (name) school.name = name;
    if (shortName !== undefined) school.shortName = shortName;
    if (motto !== undefined) school.motto = motto;
    if (affiliation !== undefined) school.affiliation = affiliation;
    if (affiliationNumber !== undefined) school.affiliationNumber = affiliationNumber;
    if (schoolCode !== undefined) school.schoolCode = schoolCode;
    if (registrationNumber !== undefined) school.registrationNumber = registrationNumber;
    if (udiseCode !== undefined) school.udiseCode = udiseCode;
    if (board !== undefined) school.board = board;
    if (academicSession !== undefined) school.academicSession = academicSession;
    if (financialYear !== undefined) school.financialYear = financialYear;
    if (address) school.address = { ...school.address, ...address };
    if (contact) school.contact = { ...school.contact, ...contact };
    if (officials) school.officials = { ...school.officials, ...officials };

    await school.save();
    res.status(200).json({ success: true, branding: { name: school.name, shortName: school.shortName, motto: school.motto, affiliation: school.affiliation, schoolCode: school.schoolCode, address: school.address, contact: school.contact, officials: school.officials } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upload school asset (logo, favicon, seal, signature, etc.)
// @route   POST /api/customization/upload-asset
// @access  Private (School Admin)
exports.uploadAsset = async (req, res) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

      const field = req.query.field || req.body.field;
      if (!field) return res.status(400).json({ success: false, error: 'Field parameter is required' });

      const school = await School.findById(req.user.schoolId);
      if (!school) return res.status(404).json({ success: false, error: 'School not found' });

      const filePath = `/${req.file.path.replace(/\\/g, '/')}`;
      setNested(school, field, filePath);
      await school.save();

      res.status(200).json({ success: true, field, url: filePath });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update document header/footer and watermark settings
// @route   PUT /api/customization/document-settings
// @access  Private (School Admin)
exports.updateDocumentSettings = async (req, res) => {
  try {
    const { documentSettings } = req.body;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    school.documentSettings = { ...school.documentSettings, ...documentSettings };
    await school.save();
    res.status(200).json({ success: true, documentSettings: school.documentSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update auto numbering configuration
// @route   PUT /api/customization/auto-numbering
// @access  Private (School Admin)
exports.updateAutoNumbering = async (req, res) => {
  try {
    const { autoNumbering } = req.body;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    Object.keys(autoNumbering || {}).forEach((key) => {
      school.autoNumbering[key] = { ...school.autoNumbering[key], ...autoNumbering[key] };
    });
    await school.save();
    res.status(200).json({ success: true, autoNumbering: school.autoNumbering });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update document templates
// @route   PUT /api/customization/document-templates
// @access  Private (School Admin)
exports.updateDocumentTemplates = async (req, res) => {
  try {
    const { documentTemplates } = req.body;
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    Object.keys(documentTemplates || {}).forEach((key) => {
      school.documentTemplates[key] = { ...school.documentTemplates[key], ...documentTemplates[key] };
    });
    await school.save();
    res.status(200).json({ success: true, documentTemplates: school.documentTemplates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Preview a document template
// @route   POST /api/customization/preview/:type
// @access  Private (School Admin)
exports.previewDocument = async (req, res) => {
  try {
    const { type } = req.params;
    const data = { schoolId: req.user.schoolId, ...req.body };
    const pdfBuffer = await documentEngine.generate(type, data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${type}-preview.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
