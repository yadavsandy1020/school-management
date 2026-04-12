const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    next();
  };
};

// Auth validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('super_admin', 'school_admin', 'teacher', 'student', 'parent').required(),
  tenantId: Joi.string().when('role', {
    is: Joi.valid('school_admin', 'teacher', 'student', 'parent'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  schoolId: Joi.string().when('role', {
    is: Joi.valid('school_admin', 'teacher', 'student', 'parent'),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  tenantId: Joi.string().optional()
});

// Student validation schemas
const studentSchema = Joi.object({
  admissionNo: Joi.string().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  classId: Joi.string().required(),
  section: Joi.string().required(),
  academicYear: Joi.string().required(),
  parent: Joi.object({
    fatherName: Joi.string().optional(),
    motherName: Joi.string().optional(),
    guardianName: Joi.string().optional(),
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      pincode: Joi.string().optional()
    }).optional()
  }).optional(),
  contact: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      pincode: Joi.string().optional()
    }).optional()
  }).optional()
});

// Teacher validation schemas
const teacherSchema = Joi.object({
  employeeId: Joi.string().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  qualification: Joi.string().optional(),
  experience: Joi.number().min(0).optional(),
  subjects: Joi.array().items(Joi.string()).optional(),
  classes: Joi.array().items(Joi.string()).optional(),
  salary: Joi.object({
    basic: Joi.number().min(0).optional(),
    allowances: Joi.number().min(0).optional(),
    deductions: Joi.number().min(0).optional()
  }).optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional()
  }).optional()
});

// Class validation schemas
const classSchema = Joi.object({
  name: Joi.string().required(),
  sections: Joi.array().items(Joi.string()).required(),
  roomNumber: Joi.string().optional(),
  capacity: Joi.number().min(1).optional()
});

// Attendance validation schemas
const attendanceSchema = Joi.object({
  date: Joi.date().required(),
  classId: Joi.string().required(),
  section: Joi.string().required(),
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.string().required(),
      status: Joi.string().valid('present', 'absent', 'late').required()
    })
  ).required()
});

// Fee validation schemas
const feeStructureSchema = Joi.object({
  classId: Joi.string().required(),
  academicSession: Joi.string().required(),
  feeItems: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('monthly', 'quarterly', 'yearly', 'one-time').required(),
      amount: Joi.number().min(0).required(),
      dueDate: Joi.date().optional()
    })
  ).required()
});

// Notice validation schemas
const noticeSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(10).required(),
  category: Joi.string().valid('general', 'exam', 'holiday', 'event', 'urgent').required(),
  priority: Joi.string().valid('low', 'medium', 'high').required(),
  targetAudience: Joi.string().valid('all', 'students', 'teachers', 'parents').required(),
  publishDate: Joi.date().optional(),
  expiryDate: Joi.date().optional()
});

// School validation schemas
const schoolSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  subdomain: Joi.string().min(3).max(50).required(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
    country: Joi.string().optional()
  }).required(),
  contact: Joi.object({
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri().optional()
  }).required(),
  academicConfig: Joi.object({
    currentSession: Joi.string().required(),
    sessionStartMonth: Joi.string().required()
  }).required()
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  studentSchema,
  teacherSchema,
  classSchema,
  attendanceSchema,
  feeStructureSchema,
  noticeSchema,
  schoolSchema
};
