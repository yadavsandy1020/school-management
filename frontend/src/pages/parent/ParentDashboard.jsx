import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ClipboardList, Landmark, BookOpen, Calendar, Bell } from 'lucide-react'

const ParentDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({ attendance: null, fees: null, homework: 0, notices: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async () => {
    try {
      const [attendanceRes, feesRes, homeworkRes, noticesRes] = await Promise.allSettled([
        api.get('/attendance/student/me/summary'),
        api.get('/fees/invoice'),
        api.get('/homework'),
        api.get('/communication/notices/parent')
      ])

      setStats({
        attendance: attendanceRes.status === 'fulfilled' ? attendanceRes.value.data?.statistics : null,
        fees: feesRes.status === 'fulfilled' ? feesRes.value.data : null,
        homework: homeworkRes.status === 'fulfilled' ? homeworkRes.value.data?.count || 0 : 0,
        notices: noticesRes.status === 'fulfilled' ? noticesRes.value.data?.count || 0 : 0
      })
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    { label: 'Attendance', value: stats.attendance ? `${stats.attendance.percentage}%` : '--', icon: ClipboardList, link: '/parent/attendance', color: 'bg-emerald-500' },
    { label: 'Pending Fees', value: stats.fees?.data?.filter(i => i.balanceAmount > 0).length || 0, icon: Landmark, link: '/parent/fees', color: 'bg-amber-500' },
    { label: 'Homework', value: stats.homework, icon: BookOpen, link: '/parent/homework', color: 'bg-indigo-500' },
    { label: 'Notices', value: stats.notices, icon: Bell, link: '/notices', color: 'bg-rose-500' },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="card p-5 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/parent/attendance" className="card flex items-center gap-4 p-5 transition hover:shadow-md">
          <ClipboardList className="h-8 w-8 text-emerald-500" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">View Attendance</p>
            <p className="text-sm text-slate-500">Check daily attendance records</p>
          </div>
        </Link>
        <Link to="/parent/fees" className="card flex items-center gap-4 p-5 transition hover:shadow-md">
          <Landmark className="h-8 w-8 text-amber-500" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Fee Details</p>
            <p className="text-sm text-slate-500">View invoices and payment history</p>
          </div>
        </Link>
        <Link to="/parent/homework" className="card flex items-center gap-4 p-5 transition hover:shadow-md">
          <BookOpen className="h-8 w-8 text-indigo-500" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Homework</p>
            <p className="text-sm text-slate-500">View assigned homework</p>
          </div>
        </Link>
        <Link to="/parent/calendar" className="card flex items-center gap-4 p-5 transition hover:shadow-md">
          <Calendar className="h-8 w-8 text-rose-500" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Calendar</p>
            <p className="text-sm text-slate-500">School events and holidays</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default ParentDashboard
