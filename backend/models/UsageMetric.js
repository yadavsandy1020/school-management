const mongoose = require('mongoose');

const usageMetricSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },

  metric: {
    type: String,
    required: true,
    enum: [
      'students', 'teachers', 'employees', 'branches', 'storage_mb',
      'reports_generated', 'pdf_generated', 'emails_sent', 'sms_sent',
      'whatsapp_messages', 'ai_requests', 'api_requests', 'monthly_logins',
      'daily_active_users', 'invoices', 'payments_collected', 'attendance_records',
      'exams', 'library_books', 'hostel_rooms', 'transport_routes'
    ]
  },

  value: {
    type: Number,
    default: 0
  },

  // For snapshot metrics captured at a point in time
  period: {
    type: String,
    enum: ['instant', 'hourly', 'daily', 'monthly', 'yearly'],
    default: 'instant'
  },

  recordedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Optional breakdown
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

usageMetricSchema.index({ tenantId: 1, metric: 1, period: 1, recordedAt: -1 });
usageMetricSchema.index({ schoolId: 1, metric: 1 });

module.exports = mongoose.model('UsageMetric', usageMetricSchema);
