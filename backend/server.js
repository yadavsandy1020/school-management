require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/school');
const userRoutes = require('./routes/user');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const attendanceRoutes = require('./routes/attendance');
const feeRoutes = require('./routes/fee');
const classRoutes = require('./routes/class');
const noticeRoutes = require('./routes/notice');
const reportRoutes = require('./routes/report');
const customizationRoutes = require('./routes/customization');
const admissionRoutes = require('./routes/admission');
const timetableRoutes = require('./routes/timetable');
const financeRoutes = require('./routes/finance');
const roleRoutes = require('./routes/role');
const academicSessionRoutes = require('./routes/academicSession');
const auditLogRoutes = require('./routes/auditLog');
const examRoutes = require('./routes/exam');
const libraryRoutes = require('./routes/library');
const transportRoutes = require('./routes/transport');
const hostelRoutes = require('./routes/hostel');
const calendarRoutes = require('./routes/calendar');
const inventoryRoutes = require('./routes/inventory');
const aiRoutes = require('./routes/ai');
const hrmsRoutes = require('./routes/hrms');
const communicationRoutes = require('./routes/communication');
const paymentRoutes = require('./routes/payment');
const saasRoutes = require('./routes/saas');
const homeworkRoutes = require('./routes/homework');
const importRoutes = require('./routes/import');
const documentsRoutes = require('./routes/documents');
const websiteRoutes = require('./routes/website');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const tenantMiddleware = require('./middleware/tenant');
const { auditMiddleware } = require('./utils/audit');

const app = express();

// Attach audit helper to every request
app.use(auditMiddleware);

// Security middleware
app.use(helmet());

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
//   max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
//   message: { success: false, error: 'Too many requests from this IP, please try again later.' }
// });
// app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin?.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
const uploadsPath = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Database connection (cached for serverless)
let dbConnectPromise = null;
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (dbConnectPromise) return dbConnectPromise;
  dbConnectPromise = mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    bufferTimeoutMS: 5000,
  }).then(conn => {
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  }).catch(error => {
    dbConnectPromise = null;
    console.error(`Error: ${error.message}`);
    if (require.main === module) process.exit(1);
  });
  return dbConnectPromise;
};

// Eagerly connect on module load (for serverless cold starts)
connectDB();

// Ensure DB connection before handling requests (serverless-safe)
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState < 1) {
      await connectDB();
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/customization', customizationRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/academic-sessions', academicSessionRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/hrms', hrmsRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/import', importRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/website', websiteRoutes);

// Public document verification (no auth required)
app.get('/api/verify/:token', async (req, res) => {
  try {
    const DocumentVerification = require('./models/DocumentVerification');
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, error: 'Token required' });
    const verification = await DocumentVerification.findOne({ verificationToken: token, isActive: true });
    if (!verification) return res.status(404).json({ success: false, error: 'Document not found or verification expired' });
    res.json({ success: true, verified: true, data: verification.publicInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'School Management API is running' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = app;
