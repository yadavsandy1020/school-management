import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Dashboard Pages
import Dashboard from './pages/Dashboard'

// Student Pages
import StudentList from './pages/students/StudentList'
import StudentForm from './pages/students/StudentForm'
import StudentDetail from './pages/students/StudentDetail'

// Teacher Pages
import TeacherList from './pages/teachers/TeacherList'
import TeacherForm from './pages/teachers/TeacherForm'
import TeacherDetail from './pages/teachers/TeacherDetail'

// Class Pages
import ClassList from './pages/classes/ClassList'
import ClassForm from './pages/classes/ClassForm'

// Attendance Pages
import AttendanceList from './pages/attendance/AttendanceList'
import MarkAttendance from './pages/attendance/MarkAttendance'

// Fee Pages
import FeeStructureList from './pages/fees/FeeStructureList'
import FeeStructureForm from './pages/fees/FeeStructureForm'
import InvoiceList from './pages/fees/InvoiceList'
import InvoiceDetail from './pages/fees/InvoiceDetail'

// Notice Pages
import NoticeList from './pages/notices/NoticeList'
import NoticeForm from './pages/notices/NoticeForm'

// Report Pages
import Reports from './pages/reports/Reports'

// Admission Pages
import AdmissionList from './pages/admissions/AdmissionList'
import AdmissionForm from './pages/admissions/AdmissionForm'

// Settings Pages
import Settings from './pages/settings/Settings'

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Student Routes */}
              <Route path="students" element={<StudentList />} />
              <Route path="students/new" element={<StudentForm />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="students/:id/edit" element={<StudentForm />} />

              {/* Teacher Routes */}
              <Route path="teachers" element={<TeacherList />} />
              <Route path="teachers/new" element={<TeacherForm />} />
              <Route path="teachers/:id" element={<TeacherDetail />} />
              <Route path="teachers/:id/edit" element={<TeacherForm />} />

              {/* Class Routes */}
              <Route path="classes" element={<ClassList />} />
              <Route path="classes/new" element={<ClassForm />} />
              <Route path="classes/:id/edit" element={<ClassForm />} />

              {/* Attendance Routes */}
              <Route path="attendance" element={<AttendanceList />} />
              <Route path="attendance/mark" element={<MarkAttendance />} />

              {/* Fee Routes */}
              <Route path="fees/structure" element={<FeeStructureList />} />
              <Route path="fees/structure/new" element={<FeeStructureForm />} />
              <Route path="fees/structure/:id/edit" element={<FeeStructureForm />} />
              <Route path="fees/invoices" element={<InvoiceList />} />
              <Route path="fees/invoices/:id" element={<InvoiceDetail />} />

              {/* Notice Routes */}
              <Route path="notices" element={<NoticeList />} />
              <Route path="notices/new" element={<NoticeForm />} />
              <Route path="notices/:id/edit" element={<NoticeForm />} />

              {/* Report Routes */}
              <Route path="reports" element={<Reports />} />

              {/* Admission Routes */}
              <Route path="admissions" element={<AdmissionList />} />
              <Route path="admissions/new" element={<AdmissionForm />} />
              <Route path="admissions/:id" element={<AdmissionForm />} />

              {/* Settings Routes */}
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
