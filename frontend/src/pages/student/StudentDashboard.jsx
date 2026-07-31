import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader, Skeleton } from '../../components/ui'
import { User, Calendar, BookOpen, FileText, DollarSign, Bell, TrendingUp } from 'lucide-react'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStudent() }, [])

  const fetchStudent = async () => {
    try {
      const res = await api.get('/students/profile')
      setStudent(res.data.data)
    } catch (error) {
      /* ignore */
    } finally { setLoading(false) }
  }

  if (loading) return <div className="grid grid-cols-1 gap-6 md:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>

  const quickLinks = [
    { label: 'My Attendance', icon: Calendar, href: '/student/attendance', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'My Results', icon: TrendingUp, href: '/student/results', color: 'bg-indigo-50 text-indigo-600' },
    { label: 'My Fees', icon: DollarSign, href: '/student/fees', color: 'bg-amber-50 text-amber-600' },
    { label: 'Notices', icon: Bell, href: '/notices', color: 'bg-rose-50 text-rose-600' },
    { label: 'Library Books', icon: BookOpen, href: '/library', color: 'bg-blue-50 text-blue-600' },
    { label: 'My Profile', icon: User, href: '/student/profile', color: 'bg-violet-50 text-violet-600' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Portal"
        title={`Welcome, ${student?.personalInfo?.firstName || user?.name || 'Student'}`}
        description="View your academic records, attendance, results, and fees"
      />

      {student && (
        <div className="card flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/10">
            <User className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{student.personalInfo?.firstName} {student.personalInfo?.lastName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Admission No: {student.admissionNo}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Class: {student.classId?.name} {student.section} • Roll No: {student.rollNo || '—'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(link => (
          <Link key={link.label} to={link.href} className="card flex items-center gap-4 transition hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${link.color}`}><link.icon className="h-5 w-5" /></div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Announcements</h3></div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Check the Notices section for school announcements.</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Events</h3></div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Visit the Calendar to see upcoming events and holidays.</p>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
