import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { ArrowLeft, Clock, User, MapPin } from 'lucide-react'

const TimetableDetail = () => {
  const { id } = useParams()
  const [timetable, setTimetable] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimetable()
  }, [id])

  const fetchTimetable = async () => {
    try {
      const response = await api.get(`/timetable/${id}`)
      setTimetable(response.data.timetable)
    } catch (error) {
      console.error('Failed to fetch timetable:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!timetable) return <div className="text-center py-12"><p className="text-gray-600">Timetable not found</p></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/timetable" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Timetable
        </Link>
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 capitalize mb-4">{timetable.day}</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <p><span className="text-gray-500">Class:</span> {timetable.classId?.name || '-'}</p>
          <p><span className="text-gray-500">Section:</span> {timetable.section}</p>
          <p><span className="text-gray-500">Session:</span> {timetable.academicSession}</p>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Periods</h3>
        <div className="space-y-3">
          {timetable.periods?.map((period, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Period {period.periodNumber}</span>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {period.startTime} - {period.endTime}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{period.subjectId?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{period.teacherId?.personalInfo?.firstName} {period.teacherId?.personalInfo?.lastName || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{period.room || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TimetableDetail
