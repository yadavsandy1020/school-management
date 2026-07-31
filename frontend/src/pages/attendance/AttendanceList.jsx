import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, CheckCircle, XCircle, Clock, ClipboardList, User } from 'lucide-react'

const AttendanceList = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState('class')
  const [attendance, setAttendance] = useState([])
  const [teacherAttendance, setTeacherAttendance] = useState([])
  const [teacherStats, setTeacherStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [selfForm, setSelfForm] = useState({ date: new Date().toISOString().split('T')[0], status: 'present', remarks: '' })

  useEffect(() => {
    if (tab === 'class') fetchAttendance()
    else fetchTeacherAttendance()
  }, [tab])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attendance')
      setAttendance(response.data.data || response.data || [])
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeacherAttendance = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const { data } = await api.get(`/attendance/self?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      if (data.success) {
        setTeacherAttendance(data.data || [])
        setTeacherStats(data.statistics || null)
      }
    } catch (error) {
      console.error('Failed to fetch teacher attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkSelf = async (e) => {
    e.preventDefault()
    setMarking(true)
    try {
      const { data } = await api.post('/attendance/self', selfForm)
      if (data.success) {
        toast.success('Attendance marked successfully')
        fetchTeacherAttendance()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark attendance')
    } finally {
      setMarking(false)
    }
  }

  const isTeacher = user?.role === 'teacher'
  const canMark = ['school_admin', 'super_admin', 'teacher'].includes(user?.role)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">View and manage attendance records</p>
        </div>
        {canMark && tab === 'class' && (
          <Link to="/attendance/mark" className="btn btn-primary inline-flex items-center">
            <Calendar className="w-4 h-4 mr-2" /> Mark Class Attendance
          </Link>
        )}
      </div>

      {isTeacher && (
        <div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setTab('self')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'self' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
          >
            <User className="h-4 w-4" /> My Attendance
          </button>
          <button
            type="button"
            onClick={() => setTab('class')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'class' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
          >
            <ClipboardList className="h-4 w-4" /> Class Attendance
          </button>
        </div>
      )}

      {tab === 'self' && isTeacher && (
        <>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark Today's Attendance</h3>
            <form onSubmit={handleMarkSelf} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="label">Date</label>
                <input type="date" name="date" value={selfForm.date} onChange={(e) => setSelfForm({ ...selfForm, date: e.target.value })} className="field" required />
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" value={selfForm.status} onChange={(e) => setSelfForm({ ...selfForm, status: e.target.value })} className="field" required>
                  <option value="present">Present</option>
                  <option value="half_day">Half Day</option>
                  <option value="absent">Absent</option>
                  <option value="work_from_home">Work From Home</option>
                </select>
              </div>
              <div>
                <label className="label">Remarks</label>
                <input type="text" name="remarks" value={selfForm.remarks} onChange={(e) => setSelfForm({ ...selfForm, remarks: e.target.value })} className="field" placeholder="Optional" />
              </div>
              <button type="submit" disabled={marking} className="btn btn-primary">{marking ? 'Marking...' : 'Mark Attendance'}</button>
            </form>
          </div>

          {teacherStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{teacherStats.totalDays}</p>
                <p className="text-sm text-gray-600">Total Marked</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{teacherStats.presentDays}</p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{teacherStats.absentDays}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{teacherStats.percentage}%</p>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
            </div>
          )}

          <div className="card overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-900 p-4">Attendance History</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {teacherAttendance.length > 0 ? (
                  teacherAttendance.map((rec) => (
                    <tr key={rec._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                          rec.status === 'present' ? 'bg-green-50 text-green-700' :
                          rec.status === 'absent' ? 'bg-red-50 text-red-700' :
                          rec.status === 'half_day' ? 'bg-amber-50 text-amber-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {rec.status === 'present' && <CheckCircle className="h-3 w-3" />}
                          {rec.status === 'absent' && <XCircle className="h-3 w-3" />}
                          {rec.status === 'half_day' && <Clock className="h-3 w-3" />}
                          {rec.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{rec.remarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="py-8 text-center text-gray-500">No attendance records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'class' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Section</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Present</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Absent</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(attendance) && attendance.length > 0 ? (
                attendance.map((att) => (
                  <tr key={att._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(att.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{att.classId?.name || '-'}</td>
                    <td className="py-3 px-4">{att.section}</td>
                    <td className="py-3 px-4 text-green-600">{att.presentCount}</td>
                    <td className="py-3 px-4 text-red-600">{att.absentCount}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="py-8 text-center text-gray-500">No attendance records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AttendanceList
