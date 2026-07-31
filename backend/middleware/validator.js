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
  role: Joi.string().valid('super_admin', 'school_admin', 'teacher', 'accountant', 'receptionist', 'student', 'parent').required(),
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
  tenantId: Joi.string().optional().allow('')
});

// Student validation schemas
const studentSchema = Joi.object({
  admissionNo: Joi.string().trim().allow('').optional(),
  rollNo: Joi.string().allow('').optional(),
  classId: Joi.string().hex().length(24).required(),
  section: Joi.string().trim().required(),
  academicSession: Joi.string().trim().required(),
  personalInfo: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    bloodGroup: Joi.string().allow('').optional(),
    religion: Joi.string().allow('').optional(),
    caste: Joi.string().allow('').optional(),
    nationality: Joi.string().allow('').optional(),
    motherTongue: Joi.string().allow('').optional()
  }).required(),
  contactInfo: Joi.object({
    phone: Joi.string().allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    address: Joi.alternatives().try(
      Joi.string().allow(''),
      Joi.object({
        street: Joi.string().allow('').optional(),
        city: Joi.string().allow('').optional(),
        state: Joi.string().allow('').optional(),
        pincode: Joi.string().allow('').optional()
      })
    )
  }).optional(),
  parentInfo: Joi.object({
    fatherName: Joi.string().required(),
    fatherPhone: Joi.string().required(),
    fatherOccupation: Joi.string().allow('').optional(),
    fatherEmail: Joi.string().email().allow('').optional(),
    motherName: Joi.string().allow('').optional(),
    motherPhone: Joi.string().allow('').optional(),
    motherOccupation: Joi.string().allow('').optional(),
    motherEmail: Joi.string().email().allow('').optional(),
    guardianName: Joi.string().allow('').optional(),
    guardianRelation: Joi.string().allow('').optional(),
    guardianPhone: Joi.string().allow('').optional()
  }).required(),
  photo: Joi.string().allow('').optional(),
  documents: Joi.array().optional(),
  customFields: Joi.object().optional()
});

// Teacher validation schemas
const teacherSchema = Joi.object({
  employeeId: Joi.string().trim().allow('').optional(),
  personalInfo: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    dateOfBirth: Joi.date().allow('').optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    bloodGroup: Joi.string().allow('').optional()
  }).required(),
  contactInfo: Joi.object({
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    emergencyContact: Joi.string().allow('').optional(),
    address: Joi.alternatives().try(
      Joi.string().allow(''),
      Joi.object({
        street: Joi.string().allow('').optional(),
        city: Joi.string().allow('').optional(),
        state: Joi.string().allow('').optional(),
        pincode: Joi.string().allow('').optional()
      })
    )
  }).required(),
  employmentDetails: Joi.object({
    designation: Joi.string().required(),
    department: Joi.string().allow('').optional(),
    joinDate: Joi.date().required(),
    employmentType: Joi.string().valid('permanent', 'contract', 'temporary').optional(),
    qualification: Joi.string().allow('').optional(),
    experience: Joi.number().min(0).optional(),
    specialization: Joi.string().allow('').optional()
  }).required(),
  subjects: Joi.array().items(Joi.string().hex().length(24)).optional(),
  classes: Joi.array().optional(),
  salaryDetails: Joi.object().optional(),
  photo: Joi.string().allow('').optional(),
  documents: Joi.array().optional(),
  customFields: Joi.object().optional()
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
