import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Calendar, Clock } from 'lucide-react'

const TimetableList = () => {
  const [timetables, setTimetables] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  useEffect(() => {
    fetchTimetables()
  }, [selectedClass, selectedSection])

  const fetchTimetables = async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedClass && { classId: selectedClass }),
        ...(selectedSection && { section: selectedSection }),
      })
      const response = await api.get(`/timetable?${params}`)
      setTimetables(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch timetables:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-gray-600 mt-1">Manage class timetables</p>
        </div>
        <Link to="/timetable/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Timetable
        </Link>
      </div>

      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input"
          >
            <option value="">All Classes</option>
            <option value="class1">Class 1</option>
            <option value="class2">Class 2</option>
          </select>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="input"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timetables.map((timetable) => (
          <div key={timetable._id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{timetable.day}</h3>
              <Calendar className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Class:</span> {timetable.classId?.name || '-'}</p>
              <p><span className="text-gray-500">Section:</span> {timetable.section}</p>
              <p><span className="text-gray-500">Periods:</span> {timetable.periods?.length || 0}</p>
            </div>
            <Link
              to={`/timetable/${timetable._id}`}
              className="btn btn-secondary mt-4 w-full text-sm"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TimetableList
