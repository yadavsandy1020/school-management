import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'

const TeacherList = () => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchTeachers()
  }, [page, searchTerm])

  const fetchTeachers = async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
      })
      const response = await api.get(`/teachers?${params}`)
      setTeachers(response.data.data || response.data)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return
    try {
      await api.delete(`/teachers/${id}`)
      fetchTeachers()
    } catch (error) {
      console.error('Failed to delete teacher:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-600 mt-1">Manage teacher records</p>
        </div>
        <Link to="/teachers/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Teacher
        </Link>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Designation</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(teachers) && teachers.length > 0 ? (
              teachers.map((teacher) => (
                <tr key={teacher._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{teacher.employeeId}</td>
                  <td className="py-3 px-4 font-medium">
                    {teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName}
                  </td>
                  <td className="py-3 px-4">{teacher.employmentDetails?.designation || '-'}</td>
                  <td className="py-3 px-4">{teacher.contactInfo?.phone || '-'}</td>
                  <td className="py-3 px-4">{teacher.contactInfo?.email || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/teachers/${teacher._id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(teacher._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="py-8 text-center text-gray-500">No teachers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TeacherList
