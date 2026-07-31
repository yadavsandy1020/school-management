import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { LayoutDashboard, Users, GraduationCap, Layers3, Landmark, FileBarChart, Bell, UserPlus, Menu, X, Search, Sun, Moon, LogOut, ChevronRight, Building2, Rocket, Bus, Mail, BookOpen, Calendar, ClipboardList, FileText, Settings, CreditCard } from 'lucide-react'
import ModuleDisabledBanner from './ModuleDisabledBanner'

const roles = ['super_admin', 'school_admin', 'teacher', 'student', 'parent']

const primaryNav = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, permission: 'DASHBOARD_VIEW', roles },
  { name: 'Admissions', href: '/admissions', icon: UserPlus, permission: 'STUDENT_CREATE', roles: ['super_admin', 'school_admin'] },
  { name: 'Students', href: '/students', icon: Users, permission: 'STUDENT_VIEW', roles: ['super_admin', 'school_admin', 'teacher'] },
  { name: 'Teachers & Staff', href: '/teachers', icon: GraduationCap, permission: 'TEACHER_VIEW', roles: ['super_admin', 'school_admin'] },
  // { name: 'HRMS', href: '/hrms', icon: Briefcase, permission: 'EMPLOYEE_VIEW', roles: ['super_admin', 'school_admin'] },
  { name: 'Classes & Sections', href: '/classes', icon: Layers3, permission: 'CLASS_VIEW', roles: ['super_admin', 'school_admin', 'teacher'] },
  { name: 'Examinations', href: '/exams', icon: FileBarChart, permission: 'CLASS_VIEW', roles: ['super_admin', 'school_admin', 'teacher'] },
  { name: 'Documents', href: '/documents', icon: FileText, permission: 'DOCUMENTS_VIEW', roles: ['super_admin', 'school_admin', 'teacher'] },
  { name: 'Attendance', href: '/attendance', icon: ClipboardList, roles: ['super_admin', 'school_admin', 'teacher'] },
  { name: 'Homework', href: '/homework', icon: BookOpen, roles: ['super_admin', 'school_admin', 'teacher', 'parent'] },
  // { name: 'Library', href: '/library', icon: BookOpen, permission: 'LIBRARY_VIEW', roles: ['super_admin', 'school_admin'] },
  { name: 'Transport', href: '/transport', icon: Bus, permission: 'TRANSPORT_VIEW', roles: ['super_admin', 'school_admin'] },
  // { name: 'Hostel', href: '/hostel', icon: Building2, permission: 'HOSTEL_VIEW', roles: ['super_admin', 'school_admin'] },
  { name: 'Fee Management', href: '/fees/invoices', icon: Landmark, permission: 'FEE_INVOICE_VIEW', roles: ['super_admin', 'school_admin'] },
  // { name: 'Online Payments', href: '/payments', icon: CreditCard, permission: 'FEE_PAYMENT_RECORD', roles: ['super_admin', 'school_admin'] },
  { name: 'Student Portal', href: '/student', icon: GraduationCap, roles: ['student'] },
]

const parentNav = [
  { name: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard, roles: ['parent'] },
  { name: 'Attendance', href: '/parent/attendance', icon: ClipboardList, roles: ['parent'] },
  { name: 'Fees', href: '/parent/fees', icon: Landmark, roles: ['parent'] },
  { name: 'Homework', href: '/parent/homework', icon: BookOpen, roles: ['parent'] },
  { name: 'Calendar', href: '/parent/calendar', icon: Calendar, roles: ['parent'] },
]

const secondaryNav = [
  { name: 'Notifications', href: '/notices', icon: Bell, permission: 'NOTICE_VIEW', roles },
  { name: 'Communication', href: '/communication', icon: Mail, permission: 'EMAIL_SEND', roles: ['super_admin', 'school_admin'] },
  { name: 'Calendar', href: '/calendar', icon: Calendar, roles },
  { name: 'Reports & Analytics', href: '/reports', icon: FileBarChart, permission: 'REPORT_VIEW', roles: ['super_admin', 'school_admin'] },
  // { name: 'Bulk Import', href: '/import', icon: FileSpreadsheet, permission: 'USER_MANAGE', roles: ['super_admin', 'school_admin'] },
  // { name: 'User Management', href: '/users', icon: Users, permission: 'USER_MANAGE', roles: ['super_admin', 'school_admin'] },
  // { name: 'Academic Sessions', href: '/settings/academic-sessions', icon: CalendarDays, permission: 'SETTINGS_VIEW', roles: ['super_admin', 'school_admin'] },
  // { name: 'Roles & Security', href: '/settings/roles', icon: Shield, permission: 'ROLE_MANAGE', roles: ['super_admin', 'school_admin'] },
  // { name: 'Audit Logs', href: '/settings/audit-logs', icon: ScrollText, permission: 'AUDIT_LOG_VIEW', roles: ['super_admin', 'school_admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'SETTINGS_VIEW', roles: ['super_admin', 'school_admin'] },
]

const superAdminNav = [
  { name: 'School Onboarding', href: '/super-admin/onboarding', icon: Rocket, roles: ['super_admin'] },
  { name: 'Subscriptions', href: '/super-admin/subscriptions', icon: CreditCard, roles: ['super_admin'] },
]

const SaaSLayout = () => {
  const { user, logout, hasPermission } = useAuth()
  const { logo, schoolName, schoolShortName } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('colorMode') === 'dark')
  const location = useLocation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('colorMode', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const navigation = (items) => items.filter((item) => {
    if (!user) return false
    if (!item.roles.includes(user.role) && user.role !== 'super_admin') return false
    if (item.permission) return hasPermission(item.permission)
    return true
  })

  const NavGroup = ({ items }) => (
    <div className="space-y-1">
      {navigation(items).map((item) => {
        const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              active
                ? 'gradient-primary text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <item.icon className={`h-[18px] w-[18px] ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
            <span className="flex-1">{item.name}</span>
            {active && <ChevronRight className="h-4 w-4 text-white" />}
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="gradient-brand flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-white shadow-md">
              {logo ? <img src={logo} alt="School logo" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-slate-950 dark:text-white">{schoolShortName || schoolName || 'EduPilot'}</p>
              <p className="truncate text-xs text-slate-400">{schoolName ? 'School Workspace' : ''}</p>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="icon-button ml-auto h-8 w-8 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {user?.role === 'parent' ? (
            <>
              <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Parent Portal</p>
              <NavGroup items={parentNav} />
            </>
          ) : (
            <>
              <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
              <NavGroup items={primaryNav} />
              <p className="px-4 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Manage</p>
              <NavGroup items={secondaryNav} />
              {user?.role === 'super_admin' && (
                <>
                  <p className="px-4 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Super Admin</p>
                  <NavGroup items={superAdminNav} />
                </>
              )}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="gradient-brand flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="truncate text-xs capitalize text-slate-400">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-h-screen lg:pl-64">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:px-6 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="icon-button">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="gradient-brand flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{schoolShortName || 'EduPilot'}</span>
          </div>
          <button onClick={() => setDark((v) => !v)} className="icon-button" aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        {/* Desktop Top Bar */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 lg:flex">
          <div className="max-w-md flex-1">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="field h-10 max-w-sm pl-9" placeholder="Search students, invoices, classes..." />
            </label>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDark((v) => !v)} className="icon-button" aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/notices" className="icon-button relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-6 lg:p-8">
          <ModuleDisabledBanner />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SaaSLayout
