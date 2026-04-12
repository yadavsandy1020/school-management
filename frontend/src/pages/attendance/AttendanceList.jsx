import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Calendar } from 'lucide-react'

const AttendanceList = () => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/attendance')
      setAttendance(response.data.data || response.data)
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">View attendance records</p>
        </div>
        <Link to="/attendance/mark" className="btn btn-primary inline-flex items-center">
          <Calendar className="w-4 h-4 mr-2" /> Mark Attendance
        </Link>
      </div>

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
    </div>
  )
}

export default AttendanceList
