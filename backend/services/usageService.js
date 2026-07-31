const UsageMetric = require('../models/UsageMetric');
const School = require('../models/School');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Class = require('../models/Class');
const FeeInvoice = require('../models/FeeInvoice');
const PaymentTransaction = require('../models/PaymentTransaction');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Book = require('../models/Book');
const HostelRoom = require('../models/HostelRoom');
const Route = require('../models/Route');

const record = async (tenantId, schoolId, metric, value, period = 'instant', metadata = {}) => {
  return await UsageMetric.create({
    tenantId,
    schoolId,
    metric,
    value,
    period,
    metadata
  });
};

const increment = async (tenantId, schoolId, metric, amount = 1, period = 'instant') => {
  const latest = await UsageMetric.findOne({ tenantId, metric, period }).sort({ recordedAt: -1 });
  const nextValue = (latest ? latest.value : 0) + amount;

  return await UsageMetric.create({
    tenantId,
    schoolId,
    metric,
    value: nextValue,
    period,
    recordedAt: new Date()
  });
};

const getLatest = async (tenantId, metric, period = 'instant') => {
  return await UsageMetric.findOne({ tenantId, metric, period }).sort({ recordedAt: -1 });
};

const getTimeSeries = async (tenantId, metric, period, start, end) => {
  return await UsageMetric.find({
    tenantId,
    metric,
    period,
    recordedAt: { $gte: start, $lte: end }
  }).sort({ recordedAt: 1 });
};

// --- Snapshot aggregations ---

const snapshotTenantUsage = async (tenantId, schoolId) => {
  const now = new Date();

  const counts = await Promise.all([
    Student.countDocuments({ tenantId, schoolId, isActive: true }),
    Teacher.countDocuments({ tenantId, schoolId, isActive: true }),
    Employee.countDocuments({ tenantId, schoolId, isActive: true }),
    User.countDocuments({ tenantId, isActive: true }),
    Class.countDocuments({ tenantId, schoolId, isActive: true }),
    FeeInvoice.countDocuments({ tenantId, schoolId }),
    PaymentTransaction.countDocuments({ tenantId, schoolId }),
    Attendance.countDocuments({ tenantId, schoolId }),
    Exam.countDocuments({ tenantId, schoolId }),
    Book.countDocuments({ tenantId, schoolId }),
    HostelRoom.countDocuments({ tenantId, schoolId }),
    Route.countDocuments({ tenantId, schoolId })
  ]);

  const metrics = [
    { metric: 'students', value: counts[0] },
    { metric: 'teachers', value: counts[1] },
    { metric: 'employees', value: counts[2] },
    { metric: 'branches', value: 1 }, // default branch count; extend if Branch model exists
    { metric: 'active_users', value: counts[3] },
    { metric: 'classes', value: counts[4] },
    { metric: 'invoices', value: counts[5] },
    { metric: 'payments_collected', value: counts[6] },
    { metric: 'attendance_records', value: counts[7] },
    { metric: 'exams', value: counts[8] },
    { metric: 'library_books', value: counts[9] },
    { metric: 'hostel_rooms', value: counts[10] },
    { metric: 'transport_routes', value: counts[11] }
  ];

  const saved = [];
  for (const m of metrics) {
    const doc = await UsageMetric.create({
      tenantId,
      schoolId,
      metric: m.metric,
      value: m.value,
      period: 'instant',
      recordedAt: now
    });
    saved.push(doc);
  }

  return saved;
};

// --- Dashboard helpers ---

const getTenantDashboardUsage = async (tenantId, schoolId) => {
  const latest = {};
  const metrics = ['students', 'teachers', 'employees', 'active_users', 'storage_mb', 'api_requests', 'emails_sent', 'sms_sent'];

  await Promise.all(metrics.map(async (m) => {
    const doc = await getLatest(tenantId, m, 'instant');
    latest[m] = doc ? doc.value : 0;
  }));

  return latest;
};

const getSuperAdminDashboardMetrics = async () => {
  const schools = await School.find({});
  const tenantIds = schools.map(s => s.tenantId);

  const [activeLicenses, expiredLicenses, totalStudents] = await Promise.all([
    License.countDocuments({ 'status.active': true }),
    License.countDocuments({ 'status.expired': true }),
    Student.countDocuments({ isActive: true })
  ]);

  return {
    totalSchools: schools.length,
    activeLicenses,
    expiredLicenses,
    totalStudents
  };
};

module.exports = {
  record,
  increment,
  getLatest,
  getTimeSeries,
  snapshotTenantUsage,
  getTenantDashboardUsage,
  getSuperAdminDashboardMetrics
};
