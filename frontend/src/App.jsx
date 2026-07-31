import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionRoute from './components/PermissionRoute'
import SaaSLayout from './components/SaaSLayout'

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

// Fee Pages
import FeeStructureList from './pages/fees/FeeStructureList'
import FeeStructureForm from './pages/fees/FeeStructureForm'
import InvoiceList from './pages/fees/InvoiceList'
import InvoiceForm from './pages/fees/InvoiceForm'
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
import RolesPermissions from './pages/settings/RolesPermissions'
import AuditLogs from './pages/settings/AuditLogs'
import AcademicSessions from './pages/settings/AcademicSessions'

// Super Admin Pages
import SchoolOnboarding from './pages/super-admin/SchoolOnboarding'
import SubscriptionManagement from './pages/super-admin/SubscriptionManagement'

// User Management
import UserManagement from './pages/users/UserManagement'

// Exam Pages
import ExamList from './pages/exams/ExamList'
import ExamForm from './pages/exams/ExamForm'
import MarksEntry from './pages/exams/MarksEntry'

// Library Pages
// import LibraryList from './pages/library/LibraryList'
// import BookForm from './pages/library/BookForm'
// import LibraryIssues from './pages/library/LibraryIssues'

// Transport Pages
import TransportDashboard from './pages/transport/TransportDashboard'

// Document Pages
import DocumentDashboard from './pages/documents/DocumentDashboard'
import DocumentSettings from './pages/documents/DocumentSettings'

// Hostel Pages
// import HostelDashboard from './pages/hostel/HostelDashboard'

// Calendar Pages
import Calendar from './pages/calendar/Calendar'

// Inventory Pages
// import InventoryDashboard from './pages/inventory/InventoryDashboard'

// AI Pages
// import AITools from './pages/ai/AITools'

// HRMS Pages
// import HRMSDashboard from './pages/hrms/HRMSDashboard'

// Communication Pages
import CommunicationCenter from './pages/communication/CommunicationCenter'

// Payment Pages
// import Payments from './pages/payments/Payments'

// Homework Pages
import HomeworkList from './pages/homework/HomeworkList'
import HomeworkForm from './pages/homework/HomeworkForm'

// Attendance Pages
import AttendanceList from './pages/attendance/AttendanceList'
import MarkAttendance from './pages/attendance/MarkAttendance'

// Student Portal Pages
import StudentDashboard from './pages/student/StudentDashboard'

// Import Pages
import DataImport from './pages/import/DataImport'

// Parent Pages
import ParentDashboard from './pages/parent/ParentDashboard'
import ChildAttendance from './pages/parent/ChildAttendance'
import ChildFees from './pages/parent/ChildFees'

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
                  <SaaSLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<PermissionRoute permission="DASHBOARD_VIEW"><Dashboard /></PermissionRoute>} />

              {/* Student Routes */}
              <Route path="students" element={<PermissionRoute permission="STUDENT_VIEW"><StudentList /></PermissionRoute>} />
              <Route path="students/new" element={<Navigate to="/admissions/new" replace />} />
              <Route path="students/:id" element={<PermissionRoute permission="STUDENT_VIEW"><StudentDetail /></PermissionRoute>} />
              <Route path="students/:id/edit" element={<PermissionRoute permission="STUDENT_UPDATE"><StudentForm /></PermissionRoute>} />

              {/* Teacher Routes */}
              <Route path="teachers" element={<PermissionRoute permission="TEACHER_VIEW"><TeacherList /></PermissionRoute>} />
              <Route path="teachers/new" element={<PermissionRoute permission="TEACHER_CREATE"><TeacherForm /></PermissionRoute>} />
              <Route path="teachers/:id" element={<PermissionRoute permission="TEACHER_VIEW"><TeacherDetail /></PermissionRoute>} />
              <Route path="teachers/:id/edit" element={<PermissionRoute permission="TEACHER_CREATE"><TeacherForm /></PermissionRoute>} />

              {/* Class Routes */}
              <Route path="classes" element={<PermissionRoute permission="CLASS_VIEW"><ClassList /></PermissionRoute>} />
              <Route path="classes/new" element={<PermissionRoute permission="CLASS_MANAGE"><ClassForm /></PermissionRoute>} />
              <Route path="classes/:id/edit" element={<PermissionRoute permission="CLASS_MANAGE"><ClassForm /></PermissionRoute>} />

              {/* Fee Routes */}
              <Route path="fees/structure" element={<PermissionRoute permission="FEE_STRUCTURE_VIEW"><FeeStructureList /></PermissionRoute>} />
              <Route path="fees/structure/new" element={<PermissionRoute permission="FEE_STRUCTURE_MANAGE"><FeeStructureForm /></PermissionRoute>} />
              <Route path="fees/structure/:id/edit" element={<PermissionRoute permission="FEE_STRUCTURE_MANAGE"><FeeStructureForm /></PermissionRoute>} />
              <Route path="fees/invoices" element={<PermissionRoute permission="FEE_INVOICE_VIEW"><InvoiceList /></PermissionRoute>} />
              <Route path="fees/invoices/new" element={<PermissionRoute permission="FEE_INVOICE_CREATE"><InvoiceForm /></PermissionRoute>} />
              <Route path="fees/invoices/:id" element={<PermissionRoute permission="FEE_INVOICE_VIEW"><InvoiceDetail /></PermissionRoute>} />

              {/* Notice Routes */}
              <Route path="notices" element={<PermissionRoute permission="NOTICE_VIEW"><NoticeList /></PermissionRoute>} />
              <Route path="notices/new" element={<PermissionRoute permission="NOTICE_CREATE"><NoticeForm /></PermissionRoute>} />
              <Route path="notices/:id/edit" element={<PermissionRoute permission="NOTICE_CREATE"><NoticeForm /></PermissionRoute>} />

              {/* Report Routes */}
              <Route path="reports" element={<PermissionRoute permission="REPORT_VIEW"><Reports /></PermissionRoute>} />

              {/* Admission Routes */}
              <Route path="admissions" element={<PermissionRoute permission="STUDENT_CREATE"><AdmissionList /></PermissionRoute>} />
              <Route path="admissions/new" element={<PermissionRoute permission="STUDENT_CREATE"><AdmissionForm /></PermissionRoute>} />
              <Route path="admissions/:id" element={<PermissionRoute permission="STUDENT_CREATE"><AdmissionForm /></PermissionRoute>} />

              {/* Settings Routes */}
              <Route path="settings" element={<PermissionRoute permission="SETTINGS_VIEW"><Settings /></PermissionRoute>} />
              <Route path="settings/roles" element={<PermissionRoute permission="ROLE_MANAGE"><RolesPermissions /></PermissionRoute>} />
              <Route path="settings/audit-logs" element={<PermissionRoute permission="AUDIT_LOG_VIEW"><AuditLogs /></PermissionRoute>} />
              <Route path="settings/academic-sessions" element={<PermissionRoute permission="SETTINGS_VIEW"><AcademicSessions /></PermissionRoute>} />

              {/* Super Admin Routes */}
              <Route path="super-admin/onboarding" element={<SchoolOnboarding />} />
              <Route path="super-admin/subscriptions" element={<SubscriptionManagement />} />

              {/* User Management */}
              <Route path="users" element={<PermissionRoute permission="USER_MANAGE"><UserManagement /></PermissionRoute>} />

              {/* Exam Routes */}
              <Route path="exams" element={<PermissionRoute permission="CLASS_VIEW"><ExamList /></PermissionRoute>} />
              <Route path="exams/new" element={<PermissionRoute permission="CLASS_MANAGE"><ExamForm /></PermissionRoute>} />
              <Route path="exams/:id/edit" element={<PermissionRoute permission="CLASS_MANAGE"><ExamForm /></PermissionRoute>} />
              <Route path="exams/:id/marks" element={<PermissionRoute permission="CLASS_VIEW"><MarksEntry /></PermissionRoute>} />

              {/* Library Routes */}
              {/* <Route path="library" element={<PermissionRoute permission="LIBRARY_VIEW"><LibraryList /></PermissionRoute>} />
              <Route path="library/new" element={<PermissionRoute permission="LIBRARY_VIEW"><BookForm /></PermissionRoute>} />
              <Route path="library/:id/edit" element={<PermissionRoute permission="LIBRARY_VIEW"><BookForm /></PermissionRoute>} />
              <Route path="library/issues" element={<PermissionRoute permission="LIBRARY_VIEW"><LibraryIssues /></PermissionRoute>} /> */}

              {/* Transport Routes */}
              <Route path="transport" element={<PermissionRoute permission="TRANSPORT_VIEW"><TransportDashboard /></PermissionRoute>} />

              {/* Document Routes */}
              <Route path="documents" element={<PermissionRoute permission="DOCUMENTS_VIEW"><DocumentDashboard /></PermissionRoute>} />
              <Route path="documents/settings" element={<PermissionRoute permission="DOCUMENTS_VIEW"><DocumentSettings /></PermissionRoute>} />

              {/* Hostel Routes */}
              {/* <Route path="hostel" element={<PermissionRoute permission="HOSTEL_VIEW"><HostelDashboard /></PermissionRoute>} /> */}

              {/* Calendar Routes */}
              <Route path="calendar" element={<Calendar />} />

              {/* Inventory Routes */}
              {/* <Route path="inventory" element={<PermissionRoute permission="INVENTORY_VIEW"><InventoryDashboard /></PermissionRoute>} /> */}

              {/* AI Routes */}
              {/* <Route path="ai-tools" element={<PermissionRoute permission="AI_TOOLS"><AITools /></PermissionRoute>} /> */}

              {/* HRMS Routes */}
              {/* <Route path="hrms" element={<PermissionRoute permission="EMPLOYEE_VIEW"><HRMSDashboard /></PermissionRoute>} /> */}

              {/* Communication Routes */}
              <Route path="communication" element={<PermissionRoute permission="EMAIL_SEND"><CommunicationCenter /></PermissionRoute>} />

              {/* Payment Routes */}
              {/* <Route path="payments" element={<PermissionRoute permission="FEE_PAYMENT_RECORD"><Payments /></PermissionRoute>} /> */}

              {/* Homework Routes */}
              <Route path="homework" element={<HomeworkList />} />
              <Route path="homework/new" element={<HomeworkForm />} />
              <Route path="homework/:id/edit" element={<HomeworkForm />} />

              {/* Attendance Routes */}
              <Route path="attendance" element={<AttendanceList />} />
              <Route path="attendance/mark" element={<MarkAttendance />} />

              {/* Student Portal Routes */}
              <Route path="student" element={<StudentDashboard />} />

              {/* Import Routes */}
              <Route path="import" element={<PermissionRoute permission="USER_MANAGE"><DataImport /></PermissionRoute>} />

              {/* Parent Routes */}
              <Route path="parent/dashboard" element={<ParentDashboard />} />
              <Route path="parent/attendance" element={<ChildAttendance />} />
              <Route path="parent/fees" element={<ChildFees />} />
              <Route path="parent/homework" element={<HomeworkList />} />
              <Route path="parent/calendar" element={<Calendar />} />
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
