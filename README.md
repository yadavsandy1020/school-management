# EduPilot — School Management System

A production-ready, multi-tenant school management web application built with the MERN stack.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT
- **Frontend:** React, Vite, TailwindCSS, Lucide Icons, React Router
- **PDF Generation:** PDFKit
- **Charts:** Recharts
- **Auth:** JWT with role-based access control (RBAC) and multi-tenancy

## Features

- **Multi-tenancy:** Tenant isolation via `tenantId` and `schoolId` on every document
- **RBAC:** Role-based permissions (super_admin, school_admin, teacher, accountant, parent, student)
- **SaaS Layer:** Plans, licenses, feature flags, usage metrics
- **Student Management:** Admissions, student CRUD, class/section management
- **Teacher Management:** Teacher CRUD, salary tracking, self-attendance
- **Attendance:** Class attendance marking, student summaries, teacher self-attendance
- **Fee Management:** Fee structures, invoices, payments, quarterly invoice generation, transport fee line items, fee defaulter list
- **Examinations:** Exam creation, marks entry, grade systems, report cards
- **Homework:** Assignment CRUD with class/section/subject filtering, parent view
- **Finance:** School expenses, teacher salary payments, salary slip PDF generation
- **Transport:** Routes, vehicles, drivers, allocations
- **Hostel:** Hostel management, room allocation
- **Library:** Book catalog, issue/return tracking
- **Inventory:** Stock management with movements
- **Communication:** Email, SMS (console provider), WhatsApp deep links, notices
- **Calendar:** School events, holidays
- **Reports:** Dashboard stats, attendance/fee/strength/exam/finance reports with export
- **Bulk Import:** CSV import for students and teachers with per-row error reporting
- **Document Engine:** PDF generation for fee receipts, invoices, salary slips, ID cards, certificates
- **Parent Portal:** Login via roll number + date of birth, view attendance/fees/homework/calendar/notices

## Prerequisites

- Node.js >= 18
- MongoDB >= 6.0

## Setup

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories and update values:

**Backend (`backend/.env`):**
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/school_management
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=90d
SUPER_ADMIN_EMAIL=admin@schoolsaas.com
SUPER_ADMIN_PASSWORD=admin123456
EMAIL_PROVIDER=console
SMS_PROVIDER=console
FROM_EMAIL=noreply@edupilot.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

**Frontend (`frontend/.env`):**
```
VITE_API_URL=http://localhost:5001/api
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This will:
- Drop all existing collections
- Create RBAC permissions and roles
- Create SaaS plans, features, pricing slabs
- Create a demo school (Rigveda Academy) with subscription and license
- Create 60 students, 10 teachers, 8 staff members
- Create classes, subjects, fee structures, invoices, attendance, exams
- Create homework, notices, calendar events, transport, hostel, library, inventory
- Print all test login credentials including parent login

### 4. Start the servers

**Backend:**
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5001`

**Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173` (or check terminal output)

## Test Logins

### Staff Logins (email + password)

| Role          | Email                       | Password       |
|---------------|-----------------------------|----------------|
| Super Admin   | admin@schoolsaas.com        | admin123456    |
| School Admin  | schooladmin@rigveda.com     | admin123       |
| Teacher       | teacher1@rigveda.com        | teacher123     |
| Accountant    | accountant@rigveda.com      | accountant123  |

### Parent Login (roll number + date of birth)

Parents login via the "Parent" tab on the login page using:
- **Roll No:** `001` (or any student's roll number)
- **Date of Birth:** Check the seed output for the exact DOB

API endpoint: `POST /api/auth/parent-login`
```json
{
  "rollNo": "001",
  "dateOfBirth": "YYYY-MM-DD"
}
```

## API Structure

All API routes are under `/api`:

| Route                  | Description                          |
|------------------------|--------------------------------------|
| `/api/auth`            | Authentication (login, parent-login)|
| `/api/students`        | Student CRUD                         |
| `/api/teachers`        | Teacher CRUD                         |
| `/api/classes`         | Class management                     |
| `/api/attendance`      | Attendance + teacher self-attendance |
| `/api/fees`            | Fee structures, invoices, defaulters |
| `/api/finance`         | Salaries, expenses, salary slip PDF  |
| `/api/homework`        | Homework CRUD                        |
| `/api/exams`           | Exams and marks                      |
| `/api/notices`         | Notices/announcements                |
| `/api/communication`   | Email, SMS, WhatsApp, parent notices |
| `/api/transport`       | Transport management                 |
| `/api/hostel`          | Hostel management                    |
| `/api/library`         | Library management                   |
| `/api/inventory`       | Inventory management                 |
| `/api/calendar`        | Calendar events                      |
| `/api/reports`         | Reports and analytics                |
| `/api/import`          | Bulk CSV import                      |
| `/api/saas`            | SaaS management                      |

## Key API Endpoints

### Quarterly Invoice Generation
```
POST /api/fees/invoice/quarterly
Body: { "classId": "<class_id>", "quarter": 1, "academicSession": "2024-25" }
```

### Fee Defaulters List
```
GET /api/fees/defaulters?classId=<optional>
```

### Teacher Self-Attendance
```
POST /api/attendance/self
Body: { "date": "2024-10-15", "status": "present", "remarks": "" }

GET /api/attendance/self?month=10&year=2024
```

### Salary Slip PDF
```
GET /api/finance/salaries/:id/slip
```

### Bulk Import
```
POST /api/import/students  (multipart/form-data with "file" field)
POST /api/import/teachers  (multipart/form-data with "file" field)
GET  /api/import/students/template
GET  /api/import/teachers/template
```

### WhatsApp Deep Link
```
GET /api/communication/whatsapp-link?phone=9876543210&message=Hello
```

## Project Structure

```
school-management/
├── backend/
│   ├── controllers/       # Express controllers
│   ├── middleware/         # Auth, RBAC, pagination, SaaS, error handler
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   ├── services/           # Document engine, communication, sequence
│   ├── scripts/            # Seed script
│   ├── utils/              # Audit, helpers
│   └── server.js           # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared components (SaaSLayout, ProtectedRoute, etc.)
│   │   ├── contexts/       # AuthContext, ThemeContext
│   │   ├── pages/          # Page components
│   │   ├── utils/          # API client, helpers
│   │   └── App.jsx         # Router setup
│   └── ...
└── README.md
```

## Multi-Tenancy

Every document includes `tenantId` and `schoolId` fields. The `protect` middleware extracts these from the JWT token and attaches them to `req.user`. All queries filter by these fields to ensure data isolation.

## Rate Limiting

Rate limiting is enabled globally on `/api` routes. Configure via:
- `RATE_LIMIT_WINDOW_MS` (default: 15 minutes)
- `RATE_LIMIT_MAX` (default: 300 requests per window)

## License

This project is proprietary software.
