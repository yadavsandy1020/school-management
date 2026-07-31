const mongoose = require('mongoose');

const websiteContentSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },

  // Theme / Design selection
  themeId: {
    type: String,
    enum: ['modern', 'playful', 'nature', 'montessori', 'premium', 'minimal'],
    default: 'playful'
  },
  branding: {
    primaryColor: { type: String, default: 'hsl(280 85% 60%)' },
    secondaryColor: { type: String, default: 'hsl(200 90% 55%)' },
    accentColor: { type: String, default: 'hsl(45 95% 55%)' },
    fontFamily: { type: String, default: 'Poppins' },
    borderRadius: { type: String, default: '0.75rem' }
  },

  // Navigation
  navigation: [{
    label: String,
    href: String,
    visible: { type: Boolean, default: true }
  }],

  // Announcement bar
  announcement: {
    enabled: { type: Boolean, default: true },
    text: { type: String, default: 'Admissions Open for 2025-26! Limited seats available.' },
    link: { type: String, default: '/admissions' },
    linkText: { type: String, default: 'Apply Now' }
  },

  // Hero section
  hero: {
    badge: { type: String, default: 'Admissions Open for 2025-26' },
    title: { type: String, default: 'Where Little Minds Bloom & Grow' },
    titleHighlight: { type: String, default: 'Bloom & Grow' },
    subtitle: { type: String, default: 'Nurturing young minds with world-class early childhood education. Play-based learning, experienced teachers, and a safe, stimulating environment for your child\'s holistic growth.' },
    image: { type: String, default: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=800' },
    primaryCtaText: { type: String, default: 'Enquire Now' },
    primaryCtaLink: { type: String, default: '/admissions' },
    secondaryCtaText: { type: String, default: 'Virtual Tour' },
    secondaryCtaLink: { type: String, default: '/about' },
    floatingCards: [{
      icon: { type: String, default: 'star' },
      title: String,
      subtitle: String
    }]
  },

  // About section
  about: {
    title: { type: String, default: 'About Our School' },
    subtitle: { type: String, default: 'Our Story' },
    description: { type: String, default: 'A nurturing preschool dedicated to providing world-class early childhood education.' },
    image: String,
    mission: String,
    vision: String,
    values: [{
      icon: String,
      title: String,
      description: String
    }]
  },

  // Stats
  stats: {
    students: { type: Number, default: 0 },
    teachers: { type: Number, default: 0 },
    branches: { type: Number, default: 1 },
    yearsActive: { type: Number, default: 1 }
  },

  // Why Choose Us features
  whyChooseUs: [{
    icon: { type: String, default: 'shield' },
    title: String,
    description: String
  }],

  // Facilities (inline for quick editing)
  facilities: [{
    icon: { type: String, default: 'book-open' },
    name: String,
    description: String,
    image: String
  }],

  // Social links
  social: {
    facebook: String,
    instagram: String,
    youtube: String,
    twitter: String
  },

  // Contact info (overrides School.contact for website)
  contact: {
    phone: String,
    whatsapp: String,
    email: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    mapEmbed: String,
    timings: { type: String, default: 'Mon - Sat: 8:00 AM - 7:00 PM' }
  },

  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String],
    ogImage: String
  },

  // Footer
  footer: {
    description: { type: String, default: 'Nurturing young minds with world-class early childhood education. Where learning meets joy, and every child blossoms.' },
    copyright: String,
    links: [{
      label: String,
      href: String
    }]
  },

  // Section visibility & ordering
  sections: [{
    type: {
      type: String,
      enum: ['hero', 'stats', 'programs', 'whyChooseUs', 'facilities', 'teachers', 'testimonials', 'gallery', 'events', 'blogPreview', 'cta', 'contact']
    },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],

  // CTA section
  cta: {
    title: { type: String, default: 'Give Your Child the Best Start in Life' },
    subtitle: { type: String, default: 'Join our family of happy parents and watch your child blossom in a nurturing, stimulating, and joyful environment.' },
    primaryCtaText: { type: String, default: 'Apply for Admission' },
    primaryCtaLink: { type: String, default: '/admissions' },
    secondaryCtaText: { type: String, default: 'Book a School Visit' },
    secondaryCtaLink: { type: String, default: '/contact' }
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

websiteContentSchema.index({ tenantId: 1, schoolId: 1 });

module.exports = mongoose.model('WebsiteContent', websiteContentSchema);
