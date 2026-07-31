import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import { Users, UserPlus, GraduationCap, Landmark, AlertCircle, Bell, CalendarDays, Plus, FileText, Send, Receipt, Wallet, CreditCard, Building2, CheckCircle, BookOpen, Rocket, Layers3 } from 'lucide-react'
import { Skeleton } from '../components/ui'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [saasStats, setSaasStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  useEffect(() => { fetchDashboardStats() }, [])

  const fetchDashboardStats = async () => {
    try {
      if (isSuperAdmin) {
        const response = await api.get('/saas/analytics/super-admin')
        if (response.data.success) setSaasStats(response.data.analytics)
      } else {
        const response = await api.get('/reports/dashboard')
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    </div>
  )

  if (isSuperAdmin) {
    const saasKpis = [
      { label: 'Total Schools', value: saasStats?.totalSchools || 0, icon: Building2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' },
      { label: 'Active Subscriptions', value: saasStats?.activeSubscriptions || 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
      { label: 'Expired Licenses', value: saasStats?.expiredLicenses || 0, icon: AlertCircle, color: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
      { label: 'Pending Renewals', value: saasStats?.pendingRenewals || 0, icon: CalendarDays, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
    ]

    const adminActions = [
      { label: 'Onboard School', href: '/super-admin/onboarding', icon: Rocket, desc: 'Create a new school tenant' },
      { label: 'Subscriptions', href: '/super-admin/subscriptions', icon: CreditCard, desc: 'Manage plans & billing' },
      { label: 'Settings', href: '/settings', icon: Layers3, desc: 'System configuration' },
    ]

    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Super Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {saasKpis.map((kpi) => (
            <div key={kpi.label} className="card flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{kpi.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {adminActions.map((action) => (
            <Link key={action.label} to={action.href} className="card flex items-center gap-4 transition hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.label}</p>
                <p className="text-xs text-slate-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {saasStats?.schools?.length > 0 ? (
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Schools Overview</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>School</th><th>Tenant ID</th><th>Plan</th><th>Status</th><th>Students</th></tr>
                </thead>
                <tbody>
                  {saasStats.schools.map(s => (
                    <tr key={s.tenantId}>
                      <td className="font-medium">{s.name}</td>
                      <td className="text-xs text-slate-500">{s.tenantId}</td>
                      <td className="capitalize">{s.plan}</td>
                      <td>
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle className="h-3 w-3" /> Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3 w-3" /> Inactive</span>
                        )}
                      </td>
                      <td>{s.usage?.studentCount ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
              <Rocket className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No schools yet</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by onboarding your first school.</p>
            <Link to="/super-admin/onboarding" className="btn btn-primary mt-4 gap-2"><Rocket className="h-4 w-4" /> Onboard School</Link>
          </div>
        )}
      </div>
    )
  }

  const isAdmin = user?.role === 'school_admin'
  const hasFeeAccess = isAdmin || user?.permissions?.includes('FEE_INVOICE_VIEW')
  const hasAttendanceAccess = isAdmin || user?.permissions?.includes('ATTENDANCE_VIEW')

  const kpis = [
    { label: 'Total Students', value: stats?.students || 0, icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10', show: true },
    { label: 'Teachers', value: stats?.teachers || 0, icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10', show: true },
    { label: 'Classes', value: stats?.classes || 0, icon: Building2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10', show: true },
    { label: 'Attendance', value: `${stats?.attendance?.percentage || 0}%`, icon: CheckCircle, color: 'text-teal-600 bg-teal-50 dark:bg-teal-500/10', show: hasAttendanceAccess },
    { label: 'Fee Collected', value: `₹${(stats?.fees?.collected || 0).toLocaleString()}`, icon: Landmark, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10', show: hasFeeAccess },
    { label: 'Outstanding Fees', value: `₹${(stats?.fees?.pending || 0).toLocaleString()}`, icon: AlertCircle, color: 'text-red-600 bg-red-50 dark:bg-red-500/10', show: hasFeeAccess },
    { label: 'Salary Paid', value: `₹${(stats?.finances?.salaries?.paid || 0).toLocaleString()}`, icon: Wallet, color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10', show: isAdmin },
    { label: 'School Expenses', value: `₹${(stats?.finances?.expenses || 0).toLocaleString()}`, icon: CreditCard, color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10', show: isAdmin },
  ].filter(k => k.show)

  const quickActions = [
    { label: 'Add Student', href: '/students/new', icon: Plus, permission: 'STUDENT_CREATE' },
    { label: 'New Admission', href: '/admissions/new', icon: UserPlus, permission: 'STUDENT_CREATE' },
    { label: 'Collect Fee', href: '/fees/invoices', icon: Receipt, permission: 'FEE_PAYMENT_RECORD' },
    { label: 'Generate Certificate', href: '/students', icon: FileText, permission: 'STUDENT_VIEW' },
    { label: 'Send Notification', href: '/notices/new', icon: Send, permission: 'NOTICE_CREATE' },
    { label: 'Mark Attendance', href: '/attendance', icon: CheckCircle, permission: 'ATTENDANCE_MARK' },
    { label: 'Add Class', href: '/classes/new', icon: BookOpen, permission: 'CLASS_MANAGE' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{kpi.value}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {quickActions.map((action) => (
              <Can key={action.label} permission={action.permission}>
                <Link to={action.href} className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
                </Link>
              </Can>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Announcements</h3>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">PTA Meeting</p>
              <p className="mt-1 text-xs text-slate-500">Scheduled for Friday, 4 PM</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Fee Deadline</p>
              <p className="mt-1 text-xs text-slate-500">Last date: 31st March</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Sports Day</p>
              <p className="mt-1 text-xs text-slate-500">Registration open until Monday</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activities</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { action: 'New student enrolled', detail: 'Rahul Sharma - Class 5A', time: '2 hours ago' },
              { action: 'Fee payment received', detail: '₹5,000 from Ananya Patel', time: '4 hours ago' },
              { action: 'Teacher profile updated', detail: 'Mrs. Sunita Verma', time: 'Yesterday' },
              { action: 'Notice published', detail: 'Holiday announcement for next week', time: 'Yesterday' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-indigo-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.action}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Calendar</h3>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { date: 'Mar 28', event: 'Annual Sports Day', type: 'event' },
              { date: 'Mar 31', event: 'Fee Payment Deadline', type: 'deadline' },
              { date: 'Apr 05', event: 'Parent-Teacher Meeting', type: 'meeting' },
              { date: 'Apr 10', event: 'Mid-Term Exams Begin', type: 'exam' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-center dark:bg-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.date.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-500">{item.date.split(' ')[1]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.event}</p>
                  <p className="text-xs capitalize text-slate-500">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
