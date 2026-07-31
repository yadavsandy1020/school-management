const mongoose = require('mongoose');

const websiteEventSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: Date,
  image: String,
  location: String,
  time: String,
  category: { type: String, enum: ['upcoming', 'past'], default: 'upcoming' },
  registrationOpen: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

websiteEventSchema.index({ tenantId: 1, schoolId: 1, date: 1 });

module.exports = mongoose.model('WebsiteEvent', websiteEventSchema);
