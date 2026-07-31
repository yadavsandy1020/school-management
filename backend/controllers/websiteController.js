const School = require('../models/School');
const WebsiteContent = require('../models/WebsiteContent');
const WebsiteProgram = require('../models/WebsiteProgram');
const WebsiteTeacher = require('../models/WebsiteTeacher');
const WebsiteTestimonial = require('../models/WebsiteTestimonial');
const WebsiteGallery = require('../models/WebsiteGallery');
const WebsiteEvent = require('../models/WebsiteEvent');
const WebsiteBlog = require('../models/WebsiteBlog');
const WebsiteFAQ = require('../models/WebsiteFAQ');
const WebsiteBranch = require('../models/WebsiteBranch');
const WebsiteAward = require('../models/WebsiteAward');

// ============================================================
// PUBLIC ENDPOINT — returns all website content for a subdomain
// ============================================================

// @desc    Get full website data by subdomain
// @route   GET /api/website/public/:subdomain
// @access  Public
exports.getPublicWebsite = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const school = await School.findOne({ subdomain, isActive: true });
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }

    const tenantId = school.tenantId;
    const schoolId = school._id;

    const [content, programs, teachers, testimonials, galleries, events, blogs, faqs, branches, awards] = await Promise.all([
      WebsiteContent.findOne({ tenantId, schoolId }).lean(),
      WebsiteProgram.find({ tenantId, schoolId, isVisible: true }).sort({ order: 1 }).lean(),
      WebsiteTeacher.find({ tenantId, schoolId, isVisible: true }).sort({ order: 1 }).lean(),
      WebsiteTestimonial.find({ tenantId, schoolId, isVisible: true }).sort({ order: 1 }).lean(),
      WebsiteGallery.find({ tenantId, schoolId, isVisible: true }).sort({ order: 1 }).lean(),
      WebsiteEvent.find({ tenantId, schoolId, isVisible: true }).sort({ date: 1 }).lean(),
      WebsiteBlog.find({ tenantId, schoolId, isVisible: true }).sort({ publishedAt: -1 }).lean(),
      WebsiteFAQ.find({ tenantId, schoolId, isVisible: true }).sort({ order: 1 }).lean(),
      WebsiteBranch.find({ tenantId, schoolId, isVisible: true }).sort({ order: 1 }).lean(),
      WebsiteAward.find({ tenantId, schoolId, isVisible: true }).sort({ order: 1 }).lean()
    ]);

    res.status(200).json({
      success: true,
      school: {
        name: school.name,
        shortName: school.shortName,
        subdomain: school.subdomain,
        logo: school.logo,
        favicon: school.favicon,
        theme: school.theme,
        template: school.template,
        address: school.address,
        contact: school.contact
      },
      content: content || {},
      programs,
      teachers,
      testimonials,
      galleries,
      events,
      blogs,
      faqs,
      branches,
      awards
    });
  } catch (error) {
    console.error('getPublicWebsite error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// WEBSITE CONTENT (site-level config)
// ============================================================

// @desc    Get website content config
// @route   GET /api/website/content
// @access  Private
exports.getWebsiteContent = async (req, res) => {
  try {
    const { tenantId, schoolId } = req.user;
    let content = await WebsiteContent.findOne({ tenantId, schoolId });

    if (!content) {
      content = await WebsiteContent.create({ tenantId, schoolId });
    }

    res.status(200).json({ success: true, content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update website content config
// @route   PUT /api/website/content
// @access  Private (School Admin)
exports.updateWebsiteContent = async (req, res) => {
  try {
    const { tenantId, schoolId } = req.user;
    const update = { ...req.body, updatedBy: req.user._id };

    let content = await WebsiteContent.findOneAndUpdate(
      { tenantId, schoolId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GENERIC CRUD FACTORY for content types
// ============================================================

function createCrudHandlers(Model, modelName, pluralName) {
  const plural = pluralName || `${modelName}s`;
  return {
    [`getAll${plural}`]: async (req, res) => {
      try {
        const { tenantId, schoolId } = req.user;
        const items = await Model.find({ tenantId, schoolId }).sort({ order: 1, createdAt: -1 });
        res.status(200).json({ success: true, count: items.length, data: items });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
      }
    },

    [`get${modelName}`]: async (req, res) => {
      try {
        const { tenantId, schoolId } = req.user;
        const item = await Model.findOne({ _id: req.params.id, tenantId, schoolId });
        if (!item) return res.status(404).json({ success: false, error: `${modelName} not found` });
        res.status(200).json({ success: true, data: item });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
      }
    },

    [`create${modelName}`]: async (req, res) => {
      try {
        const { tenantId, schoolId } = req.user;
        const item = await Model.create({ ...req.body, tenantId, schoolId });
        res.status(201).json({ success: true, data: item });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
      }
    },

    [`update${modelName}`]: async (req, res) => {
      try {
        const { tenantId, schoolId } = req.user;
        const item = await Model.findOneAndUpdate(
          { _id: req.params.id, tenantId, schoolId },
          { $set: req.body },
          { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ success: false, error: `${modelName} not found` });
        res.status(200).json({ success: true, data: item });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
      }
    },

    [`delete${modelName}`]: async (req, res) => {
      try {
        const { tenantId, schoolId } = req.user;
        const item = await Model.findOneAndDelete({ _id: req.params.id, tenantId, schoolId });
        if (!item) return res.status(404).json({ success: false, error: `${modelName} not found` });
        res.status(200).json({ success: true, message: `${modelName} deleted successfully` });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
      }
    },

    [`reorder${plural}`]: async (req, res) => {
      try {
        const { tenantId, schoolId } = req.user;
        const { items } = req.body; // [{ id, order }]
        const ops = items.map(({ id, order }) =>
          Model.findOneAndUpdate({ _id: id, tenantId, schoolId }, { $set: { order } })
        );
        await Promise.all(ops);
        res.status(200).json({ success: true, message: `${modelName}s reordered` });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
      }
    }
  };
}

// Generate CRUD handlers for each content type
const ProgramHandlers = createCrudHandlers(WebsiteProgram, 'Program');
const TeacherHandlers = createCrudHandlers(WebsiteTeacher, 'Teacher');
const TestimonialHandlers = createCrudHandlers(WebsiteTestimonial, 'Testimonial');
const GalleryHandlers = createCrudHandlers(WebsiteGallery, 'Gallery', 'Galleries');
const EventHandlers = createCrudHandlers(WebsiteEvent, 'Event');
const BlogHandlers = createCrudHandlers(WebsiteBlog, 'Blog');
const FAQHandlers = createCrudHandlers(WebsiteFAQ, 'FAQ');
const BranchHandlers = createCrudHandlers(WebsiteBranch, 'Branch', 'Branches');
const AwardHandlers = createCrudHandlers(WebsiteAward, 'Award');

// Export everything
exports.getAllPrograms = ProgramHandlers.getAllPrograms;
exports.getProgram = ProgramHandlers.getProgram;
exports.createProgram = ProgramHandlers.createProgram;
exports.updateProgram = ProgramHandlers.updateProgram;
exports.deleteProgram = ProgramHandlers.deleteProgram;
exports.reorderPrograms = ProgramHandlers.reorderPrograms;

exports.getAllTeachers = TeacherHandlers.getAllTeachers;
exports.getTeacher = TeacherHandlers.getTeacher;
exports.createTeacher = TeacherHandlers.createTeacher;
exports.updateTeacher = TeacherHandlers.updateTeacher;
exports.deleteTeacher = TeacherHandlers.deleteTeacher;
exports.reorderTeachers = TeacherHandlers.reorderTeachers;

exports.getAllTestimonials = TestimonialHandlers.getAllTestimonials;
exports.getTestimonial = TestimonialHandlers.getTestimonial;
exports.createTestimonial = TestimonialHandlers.createTestimonial;
exports.updateTestimonial = TestimonialHandlers.updateTestimonial;
exports.deleteTestimonial = TestimonialHandlers.deleteTestimonial;
exports.reorderTestimonials = TestimonialHandlers.reorderTestimonials;

exports.getAllGalleries = GalleryHandlers.getAllGalleries;
exports.getGallery = GalleryHandlers.getGallery;
exports.createGallery = GalleryHandlers.createGallery;
exports.updateGallery = GalleryHandlers.updateGallery;
exports.deleteGallery = GalleryHandlers.deleteGallery;
exports.reorderGalleries = GalleryHandlers.reorderGalleries;

exports.getAllEvents = EventHandlers.getAllEvents;
exports.getEvent = EventHandlers.getEvent;
exports.createEvent = EventHandlers.createEvent;
exports.updateEvent = EventHandlers.updateEvent;
exports.deleteEvent = EventHandlers.deleteEvent;
exports.reorderEvents = EventHandlers.reorderEvents;

exports.getAllBlogs = BlogHandlers.getAllBlogs;
exports.getBlog = BlogHandlers.getBlog;
exports.createBlog = BlogHandlers.createBlog;
exports.updateBlog = BlogHandlers.updateBlog;
exports.deleteBlog = BlogHandlers.deleteBlog;
exports.reorderBlogs = BlogHandlers.reorderBlogs;

exports.getAllFAQs = FAQHandlers.getAllFAQs;
exports.getFAQ = FAQHandlers.getFAQ;
exports.createFAQ = FAQHandlers.createFAQ;
exports.updateFAQ = FAQHandlers.updateFAQ;
exports.deleteFAQ = FAQHandlers.deleteFAQ;
exports.reorderFAQs = FAQHandlers.reorderFAQs;

exports.getAllBranches = BranchHandlers.getAllBranches;
exports.getBranch = BranchHandlers.getBranch;
exports.createBranch = BranchHandlers.createBranch;
exports.updateBranch = BranchHandlers.updateBranch;
exports.deleteBranch = BranchHandlers.deleteBranch;
exports.reorderBranches = BranchHandlers.reorderBranches;

exports.getAllAwards = AwardHandlers.getAllAwards;
exports.getAward = AwardHandlers.getAward;
exports.createAward = AwardHandlers.createAward;
exports.updateAward = AwardHandlers.updateAward;
exports.deleteAward = AwardHandlers.deleteAward;
exports.reorderAwards = AwardHandlers.reorderAwards;
