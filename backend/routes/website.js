const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requireActiveLicense, requireWriteAccess } = require('../middleware/saas');
const {
  getPublicWebsite,
  getWebsiteContent,
  updateWebsiteContent,
  getAllPrograms, getProgram, createProgram, updateProgram, deleteProgram, reorderPrograms,
  getAllTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, reorderTeachers,
  getAllTestimonials, getTestimonial, createTestimonial, updateTestimonial, deleteTestimonial, reorderTestimonials,
  getAllGalleries, getGallery, createGallery, updateGallery, deleteGallery, reorderGalleries,
  getAllEvents, getEvent, createEvent, updateEvent, deleteEvent, reorderEvents,
  getAllBlogs, getBlog, createBlog, updateBlog, deleteBlog, reorderBlogs,
  getAllFAQs, getFAQ, createFAQ, updateFAQ, deleteFAQ, reorderFAQs,
  getAllBranches, getBranch, createBranch, updateBranch, deleteBranch, reorderBranches,
  getAllAwards, getAward, createAward, updateAward, deleteAward, reorderAwards
} = require('../controllers/websiteController');

// ============================================================
// PUBLIC ROUTE — no auth required
// ============================================================
router.get('/public/:subdomain', getPublicWebsite);

// ============================================================
// PROTECTED ROUTES — require auth + active license
// ============================================================
router.use(protect, requireActiveLicense);

// Website content config
router.get('/content', getWebsiteContent);
router.put('/content', authorize('school_admin', 'super_admin'), requireWriteAccess, updateWebsiteContent);

// Programs
router.route('/programs')
  .get(getAllPrograms)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createProgram);
router.route('/programs/:id')
  .get(getProgram)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateProgram)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteProgram);
router.put('/programs/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderPrograms);

// Teachers
router.route('/teachers')
  .get(getAllTeachers)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createTeacher);
router.route('/teachers/:id')
  .get(getTeacher)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateTeacher)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteTeacher);
router.put('/teachers/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderTeachers);

// Testimonials
router.route('/testimonials')
  .get(getAllTestimonials)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createTestimonial);
router.route('/testimonials/:id')
  .get(getTestimonial)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateTestimonial)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteTestimonial);
router.put('/testimonials/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderTestimonials);

// Galleries
router.route('/galleries')
  .get(getAllGalleries)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createGallery);
router.route('/galleries/:id')
  .get(getGallery)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateGallery)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteGallery);
router.put('/galleries/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderGalleries);

// Events
router.route('/events')
  .get(getAllEvents)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createEvent);
router.route('/events/:id')
  .get(getEvent)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateEvent)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteEvent);
router.put('/events/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderEvents);

// Blogs
router.route('/blogs')
  .get(getAllBlogs)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createBlog);
router.route('/blogs/:id')
  .get(getBlog)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateBlog)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteBlog);
router.put('/blogs/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderBlogs);

// FAQs
router.route('/faqs')
  .get(getAllFAQs)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createFAQ);
router.route('/faqs/:id')
  .get(getFAQ)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateFAQ)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteFAQ);
router.put('/faqs/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderFAQs);

// Branches
router.route('/branches')
  .get(getAllBranches)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createBranch);
router.route('/branches/:id')
  .get(getBranch)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateBranch)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteBranch);
router.put('/branches/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderBranches);

// Awards
router.route('/awards')
  .get(getAllAwards)
  .post(authorize('school_admin', 'super_admin'), requireWriteAccess, createAward);
router.route('/awards/:id')
  .get(getAward)
  .put(authorize('school_admin', 'super_admin'), requireWriteAccess, updateAward)
  .delete(authorize('school_admin', 'super_admin'), requireWriteAccess, deleteAward);
router.put('/awards/reorder', authorize('school_admin', 'super_admin'), requireWriteAccess, reorderAwards);

module.exports = router;
