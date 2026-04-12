# School Management System

A complete, production-ready, multi-tenant School Management System built with MERN stack (MongoDB, Express, React, Node.js).

## Features

### Core Functionality
- **Multi-Tenant Architecture**: Each school operates as an isolated tenant
- **Role-Based Access Control**: Super Admin, School Admin, Teacher, Student, Parent
- **White-Label Branding**: Customizable themes, logos, and templates per school
- **Student Management**: Complete CRUD operations, profiles, parent linking
- **Teacher Management**: Profiles, subject assignment, salary tracking
- **Attendance System**: Daily attendance, bulk marking, reports
- **Fees & Invoicing**: Fee structures, invoice generation, payment tracking, PDF receipts
- **Notice Board**: School-wide and class-specific announcements
- **Class & Subject Management**: Full academic structure management
- **Admission/Enrollment**: Application workflow with approval process
- **Reports & Analytics**: Dashboard statistics, CSV/PDF exports
- **Customization Engine**: Theme colors, logo upload, configurable modules

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose ODM
- JWT Authentication
- bcrypt for password hashing
- PDFKit for receipt generation
- Multer for file uploads

### Frontend
- React 18 with Vite
- React Router v6
- Tailwind CSS
- Axios for API calls
- React Hook Form
- Lucide React icons
- react-hot-toast

## Prerequisites

- Node.js 18+
- MongoDB 7+
- npm or yarn

## Installation

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Configure your `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/school-management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
SUPER_ADMIN_EMAIL=admin@schoolsaas.com
SUPER_ADMIN_PASSWORD=admin123456
FRONTEND_URL=http://localhost:5173
```

Seed the database:
```bash
npm run seed
```

Start the backend:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Configure `.env`:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend on port 80

### Manual Docker Build

Build backend:
```bash
docker build --target backend -t school-backend .
```

Build frontend:
```bash
docker build --target frontend -t school-frontend .
```

## Deployment

### Free Hosting Options

#### Backend (Render/Railway)
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

#### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure build settings:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
4. Set environment variables
5. Deploy

#### Database (MongoDB Atlas)
1. Create free tier cluster
2. Get connection string
4. Update environment variables

### Environment Variables

Required for production:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secure random string
- `JWT_EXPIRE`: Token expiration time
- `FRONTEND_URL`: Frontend URL
- `PORT`: Server port

## Default Credentials

After running seed script:

**Super Admin:**
- Email: admin@schoolsaas.com
- Password: admin123456

**Demo School:**
- Tenant ID: demo-school-123456
- School Admin: schooladmin@demoschool.com / admin123
- Teacher: teacher@demoschool.com / teacher123

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/updatepassword` - Update password

### Schools
- POST `/api/schools` - Create school (Super Admin)
- GET `/api/schools` - Get all schools (Super Admin)
- GET `/api/schools/:id` - Get single school
- PUT `/api/schools/:id` - Update school
- GET `/api/schools/tenant/:tenantId` - Get school by tenant ID

### Students
- POST `/api/students` - Create student
- GET `/api/students` - Get all students
- GET `/api/students/:id` - Get single student
- PUT `/api/students/:id` - Update student
- DELETE `/api/students/:id` - Delete student
- POST `/api/students/bulk` - Bulk import students

### Teachers
- POST `/api/teachers` - Create teacher
- GET `/api/teachers` - Get all teachers
- GET `/api/teachers/:id` - Get single teacher
- PUT `/api/teachers/:id` - Update teacher
- DELETE `/api/teachers/:id` - Delete teacher
- PUT `/api/teachers/:id/subjects` - Assign subjects
- PUT `/api/teachers/:id/salary` - Update salary

### Attendance
- POST `/api/attendance` - Mark attendance
- GET `/api/attendance` - Get attendance records
- GET `/api/attendance/:id` - Get single attendance
- PUT `/api/attendance/:id` - Update attendance
- GET `/api/attendance/student/:studentId` - Get student attendance
- GET `/api/attendance/report/:classId` - Get class attendance report

### Fees
- POST `/api/fees/structure` - Create fee structure
- GET `/api/fees/structure` - Get fee structures
- POST `/api/fees/invoice` - Generate invoice
- GET `/api/fees/invoice` - Get invoices
- POST `/api/fees/invoice/:id/payment` - Record payment
- GET `/api/fees/invoice/:id/receipt` - Download PDF receipt

### Classes
- POST `/api/classes` - Create class
- GET `/api/classes` - Get all classes
- GET `/api/classes/:id` - Get single class
- PUT `/api/classes/:id` - Update class
- DELETE `/api/classes/:id` - Delete class

### Notices
- POST `/api/notices` - Create notice
- GET `/api/notices` - Get notices
- GET `/api/notices/:id` - Get single notice
- PUT `/api/notices/:id` - Update notice
- DELETE `/api/notices/:id` - Delete notice

### Reports
- GET `/api/reports/dashboard` - Dashboard statistics
- GET `/api/reports/attendance` - Attendance report
- GET `/api/reports/fees` - Fee collection report
- GET `/api/reports/export/:type` - Export CSV

### Customization
- PUT `/api/customization/theme` - Update theme colors
- POST `/api/customization/logo` - Upload logo
- PUT `/api/customization/modules` - Update enabled modules
- GET `/api/customization` - Get customization settings

### Admissions
- POST `/api/admissions` - Create admission application
- GET `/api/admissions` - Get all admissions
- PUT `/api/admissions/:id/review` - Review application
- PUT `/api/admissions/:id/approve` - Approve application
- PUT `/api/admissions/:id/reject` - Reject application
- POST `/api/admissions/:id/enroll` - Enroll as student

## Project Structure

```
school-management/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── scripts/         # Seed script
│   ├── uploads/         # File uploads
│   ├── server.js        # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Utility functions
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control middleware
- Tenant isolation middleware
- Input validation with express-validator
- Rate limiting with express-rate-limit
- Helmet for security headers

## Performance Optimization

- Pagination for all list endpoints
- Database indexing on frequently queried fields
- Lazy loading for frontend
- API response caching where applicable

## Monetization Ready

- Subscription field per school
- Plan-based feature enabling/disabling
- Structure ready for Razorpay integration
- Custom fields support for additional data

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
