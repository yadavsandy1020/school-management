require('dotenv').config();
const mongoose = require('mongoose');
const School = require('./models/School');
const WebsiteContent = require('./models/WebsiteContent');
const WebsiteProgram = require('./models/WebsiteProgram');
const WebsiteTeacher = require('./models/WebsiteTeacher');
const WebsiteTestimonial = require('./models/WebsiteTestimonial');
const WebsiteGallery = require('./models/WebsiteGallery');
const WebsiteEvent = require('./models/WebsiteEvent');
const WebsiteBlog = require('./models/WebsiteBlog');
const WebsiteFAQ = require('./models/WebsiteFAQ');
const WebsiteBranch = require('./models/WebsiteBranch');
const WebsiteAward = require('./models/WebsiteAward');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management';

async function seedWebsiteData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first school (or one with subdomain 'rigveda')
    const school = await School.findOne({ subdomain: 'rigveda' }) || await School.findOne({});
    if (!school) {
      console.error('No school found. Please create a school first.');
      process.exit(1);
    }

    console.log(`Seeding website data for school: ${school.name} (${school.subdomain})`);

    const tenantId = school.tenantId;
    const schoolId = school._id;

    // Check if website content already exists
    const existingContent = await WebsiteContent.findOne({ tenantId, schoolId });
    if (existingContent) {
      console.log('Website content already exists. Skipping content seed.');
    } else {
      await WebsiteContent.create({
        tenantId,
        schoolId,
        themeId: 'playful',
        branding: {
          primaryColor: 'hsl(280 85% 60%)',
          secondaryColor: 'hsl(200 90% 55%)',
          accentColor: 'hsl(45 95% 55%)',
          fontFamily: 'Poppins',
          borderRadius: '0.75rem',
        },
        navigation: [
          { label: 'Home', href: '/', visible: true },
          { label: 'About', href: '/about', visible: true },
          { label: 'Programs', href: '/programs', visible: true },
          { label: 'Admissions', href: '/admissions', visible: true },
          { label: 'Gallery', href: '/gallery', visible: true },
          { label: 'Events', href: '/events', visible: true },
          { label: 'Blogs', href: '/blogs', visible: true },
          { label: 'Contact', href: '/contact', visible: true },
        ],
        announcement: {
          enabled: true,
          text: 'Admissions Open for 2025-26! Limited seats available.',
          link: '/admissions',
          linkText: 'Apply Now',
        },
        hero: {
          badge: 'Admissions Open for 2025-26',
          title: 'Where Little Minds Bloom & Grow',
          titleHighlight: 'Bloom & Grow',
          subtitle: 'Nurturing young minds with world-class early childhood education. Play-based learning, experienced teachers, and a safe, stimulating environment for your child\'s holistic growth.',
          image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=800',
          primaryCtaText: 'Enquire Now',
          primaryCtaLink: '/admissions',
          secondaryCtaText: 'Virtual Tour',
          secondaryCtaLink: '/about',
          floatingCards: [
            { icon: '🌟', title: 'Play-Based', subtitle: 'Learning' },
            { icon: '🎨', title: 'Creative', subtitle: 'Activities' },
          ],
        },
        about: {
          title: 'About Our School',
          subtitle: 'Our Story',
          description: 'A nurturing preschool dedicated to providing world-class early childhood education.',
          mission: 'To provide a safe, nurturing, and stimulating environment where children develop a love for learning, build confidence, and grow into well-rounded individuals.',
          vision: 'To be the most trusted preschool brand that sets the benchmark for early childhood education through innovation, care, and excellence.',
        },
        stats: {
          students: 150,
          teachers: 12,
          branches: 2,
          yearsActive: 8,
        },
        whyChooseUs: [
          { icon: 'shield', title: 'Safe & Secure', description: 'CCTV surveillance, secure access, and trained staff ensure your child\'s safety at all times.' },
          { icon: 'book-open', title: 'Expert Curriculum', description: 'Research-backed curriculum designed by early childhood education experts.' },
          { icon: 'users', title: 'Low Ratio', description: '10:1 student-teacher ratio ensures personalized attention for every child.' },
          { icon: 'heart', title: 'Caring Teachers', description: 'Qualified, experienced, and passionate teachers who truly care about your child.' },
          { icon: 'award', title: 'Award Winning', description: 'Recognized for excellence in early childhood education year after year.' },
          { icon: 'lightbulb', title: 'Innovative Learning', description: 'Smart classrooms, interactive tools, and creative teaching methods.' },
        ],
        facilities: [
          { icon: '📚', name: 'Smart Classrooms', description: 'Interactive smart boards', image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600' },
          { icon: '🌳', name: 'Outdoor Play Area', description: 'Safe & well-equipped', image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600' },
          { icon: '🎨', name: 'Art & Craft Studio', description: 'Creative expression space', image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600' },
          { icon: '🎵', name: 'Music & Dance Room', description: 'Rhythm & movement', image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600' },
          { icon: '🚌', name: 'Safe Transportation', description: 'GPS-enabled buses', image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600' },
          { icon: '🍎', name: 'Nutritious Meals', description: 'Fresh & balanced diet', image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600' },
        ],
        social: {
          facebook: 'https://facebook.com',
          instagram: 'https://instagram.com',
          youtube: 'https://youtube.com',
        },
        contact: {
          phone: '+91 98765 43210',
          whatsapp: '+91 98765 43210',
          email: 'info@preschool.com',
          address: '123 Education Street',
          city: 'Your City',
          state: 'Your State',
          pincode: '123456',
          mapEmbed: 'https://maps.google.com/maps?q=preschool&t=&z=13&ie=UTF8&iwloc=&output=embed',
          timings: 'Mon - Sat: 8:00 AM - 7:00 PM',
        },
        footer: {
          description: 'Nurturing young minds with world-class early childhood education. Where learning meets joy, and every child blossoms.',
          copyright: 'All rights reserved.',
          links: [
            { label: 'Privacy Policy', href: '/privacy-policy' },
            { label: 'Terms', href: '/terms' },
          ],
        },
        sections: [
          { type: 'hero', visible: true, order: 0 },
          { type: 'stats', visible: true, order: 1 },
          { type: 'programs', visible: true, order: 2 },
          { type: 'whyChooseUs', visible: true, order: 3 },
          { type: 'facilities', visible: true, order: 4 },
          { type: 'teachers', visible: true, order: 5 },
          { type: 'testimonials', visible: true, order: 6 },
          { type: 'gallery', visible: true, order: 7 },
          { type: 'events', visible: true, order: 8 },
          { type: 'blogPreview', visible: true, order: 9 },
          { type: 'cta', visible: true, order: 10 },
          { type: 'contact', visible: true, order: 11 },
        ],
        cta: {
          title: 'Give Your Child the Best Start in Life',
          subtitle: 'Join our family of happy parents and watch your child blossom in a nurturing, stimulating, and joyful environment.',
          primaryCtaText: 'Apply for Admission',
          primaryCtaLink: '/admissions',
          secondaryCtaText: 'Book a School Visit',
          secondaryCtaLink: '/contact',
        },
      });
      console.log('Website content seeded successfully');
    }

    // Seed Programs (Play way, Nursery, LKG, UKG only)
    const existingPrograms = await WebsiteProgram.find({ tenantId, schoolId });
    if (existingPrograms.length > 0) {
      console.log(`Programs already exist (${existingPrograms.length}). Skipping program seed.`);
    } else {
      await WebsiteProgram.insertMany([
        {
          tenantId, schoolId,
          name: 'Play Way',
          ageRange: '1.5 - 2.5 years',
          description: 'A joyful introduction to learning through play, sensory activities, and social interaction. Designed to help toddlers develop motor skills, language, and emotional awareness.',
          image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600',
          features: ['Sensory Play', 'Story Time', 'Music & Movement', 'Social Interaction'],
          schedule: '9:00 AM - 12:00 PM',
          order: 1,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          name: 'Nursery',
          ageRange: '2.5 - 3.5 years',
          description: 'Building foundational skills through structured play, phonics, numeracy, and creative arts. Children develop independence, curiosity, and a love for learning.',
          image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600',
          features: ['Phonics Basics', 'Number Recognition', 'Art & Craft', 'Free Play'],
          schedule: '9:00 AM - 12:30 PM',
          order: 2,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          name: 'LKG (Junior KG)',
          ageRange: '3.5 - 4.5 years',
          description: 'Advanced literacy and numeracy skills, environmental awareness, and creative expression. Children build confidence in reading, writing, and problem-solving.',
          image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600',
          features: ['Reading & Writing', 'Mathematics', 'Environmental Studies', 'Creative Arts'],
          schedule: '9:00 AM - 1:00 PM',
          order: 3,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          name: 'UKG (Senior KG)',
          ageRange: '4.5 - 5.5 years',
          description: 'School readiness program with advanced literacy, numeracy, and critical thinking. Prepares children for a smooth transition to primary school.',
          image: 'https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?auto=compress&cs=tinysrgb&w=600',
          features: ['Advanced Reading', 'Addition & Subtraction', 'General Knowledge', 'Public Speaking'],
          schedule: '9:00 AM - 1:30 PM',
          order: 4,
          isVisible: true,
        },
      ]);
      console.log('Programs seeded successfully (Play Way, Nursery, LKG, UKG)');
    }

    // Seed Teachers
    const existingTeachers = await WebsiteTeacher.find({ tenantId, schoolId });
    if (existingTeachers.length > 0) {
      console.log(`Teachers already exist (${existingTeachers.length}). Skipping teacher seed.`);
    } else {
      await WebsiteTeacher.insertMany([
        {
          tenantId, schoolId,
          name: 'Priya Sharma',
          role: 'Principal & Lead Teacher',
          qualification: 'M.Ed',
          experience: '18 years',
          image: 'https://images.pexels.com/photos/37302643/pexels-photo-37302643.jpeg?auto=compress&cs=tinysrgb&w=600',
          specialization: 'Early Childhood Education',
          featured: true,
          order: 1,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          name: 'Anjali Verma',
          role: 'Nursery Teacher',
          qualification: 'B.Ed, NTT',
          experience: '8 years',
          image: 'https://images.pexels.com/photos/37302643/pexels-photo-37302643.jpeg?auto=compress&cs=tinysrgb&w=600',
          specialization: 'Play-Based Learning',
          featured: true,
          order: 2,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          name: 'Meera Iyer',
          role: 'LKG Teacher',
          qualification: 'B.Ed',
          experience: '6 years',
          image: 'https://images.pexels.com/photos/37302643/pexels-photo-37302643.jpeg?auto=compress&cs=tinysrgb&w=600',
          specialization: 'Phonics & Literacy',
          featured: true,
          order: 3,
          isVisible: true,
        },
      ]);
      console.log('Teachers seeded successfully');
    }

    // Seed Testimonials
    const existingTestimonials = await WebsiteTestimonial.find({ tenantId, schoolId });
    if (existingTestimonials.length > 0) {
      console.log(`Testimonials already exist (${existingTestimonials.length}). Skipping testimonial seed.`);
    } else {
      await WebsiteTestimonial.insertMany([
        {
          tenantId, schoolId,
          name: 'Rajesh Kumar',
          role: 'Parent',
          parentOf: 'Aarav (UKG)',
          content: 'The teachers are incredibly caring and the curriculum is well-structured. My son has grown so much since joining. Highly recommended!',
          rating: 5,
          image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
          featured: true,
          order: 1,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          name: 'Sneha Gupta',
          role: 'Parent',
          parentOf: 'Diya (Nursery)',
          content: 'The play-based learning approach is wonderful. My daughter looks forward to going to school every day. The staff is very supportive.',
          rating: 5,
          image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
          featured: true,
          order: 2,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          name: 'Amit Singh',
          role: 'Parent',
          parentOf: 'Vihaan (LKG)',
          content: 'Excellent infrastructure and caring teachers. The school focuses on holistic development, not just academics. Very happy with our choice.',
          rating: 5,
          image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
          featured: true,
          order: 3,
          isVisible: true,
        },
      ]);
      console.log('Testimonials seeded successfully');
    }

    // Seed FAQs
    const existingFAQs = await WebsiteFAQ.find({ tenantId, schoolId });
    if (existingFAQs.length > 0) {
      console.log(`FAQs already exist (${existingFAQs.length}). Skipping FAQ seed.`);
    } else {
      await WebsiteFAQ.insertMany([
        {
          tenantId, schoolId,
          question: 'What is the admission process?',
          answer: 'The admission process involves submitting an enquiry form, visiting the campus, completing the admission form, and paying the fees. Our team will guide you through each step.',
          category: 'Admissions',
          order: 1,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          question: 'What are the age requirements for each program?',
          answer: 'Play Way: 1.5-2.5 years, Nursery: 2.5-3.5 years, LKG: 3.5-4.5 years, UKG: 4.5-5.5 years. Age is calculated as of June 1st of the academic year.',
          category: 'Admissions',
          order: 2,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          question: 'What is the student-teacher ratio?',
          answer: 'We maintain a low 10:1 student-teacher ratio to ensure personalized attention for every child.',
          category: 'Academics',
          order: 3,
          isVisible: true,
        },
        {
          tenantId, schoolId,
          question: 'Do you provide transportation?',
          answer: 'Yes, we provide GPS-enabled safe transportation with trained staff. Routes cover major residential areas.',
          category: 'Facilities',
          order: 4,
          isVisible: true,
        },
      ]);
      console.log('FAQs seeded successfully');
    }

    console.log('\n✅ Website data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedWebsiteData();
