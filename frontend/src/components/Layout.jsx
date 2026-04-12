import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  Bell,
  FileText,
  UserPlus,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const Layout = () => {
  const { user, logout } = useAuth()
  const { logo } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'school_admin', 'teacher', 'student', 'parent'] },
    { name: 'Students', href: '/students', icon: Users, roles: ['super_admin', 'school_admin', 'teacher'] },
    { name: 'Teachers', href: '/teachers', icon: GraduationCap, roles: ['super_admin', 'school_admin'] },
    { name: 'Classes', href: '/classes', icon: FileText, roles: ['super_admin', 'school_admin', 'teacher'] },
    { name: 'Attendance', href: '/attendance', icon: Calendar, roles: ['super_admin', 'school_admin', 'teacher'] },
    { name: 'Fees', href: '/fees/invoices', icon: DollarSign, roles: ['super_admin', 'school_admin'] },
    { name: 'Notices', href: '/notices', icon: Bell, roles: ['super_admin', 'school_admin', 'teacher', 'student', 'parent'] },
    { name: 'Admissions', href: '/admissions', icon: UserPlus, roles: ['super_admin', 'school_admin'] },
    { name: 'Reports', href: '/reports', icon: FileText, roles: ['super_admin', 'school_admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'school_admin'] },
  ]

  const filteredNavigation = navigation.filter(item => item.roles.includes(user?.role))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b">
          {logo ? (
            <img src={logo} alt="School Logo" className="h-12 w-auto" />
          ) : (
            <span className="text-xl font-bold text-primary-600">School Management</span>
          )}
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.name}
            </span>
            <span className="px-3 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
              {user?.role?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
