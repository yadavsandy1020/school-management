import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Edit, Trash2 } from 'lucide-react'

const ClassList = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes')
      setClasses(response.data.data || response.data)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return
    try {
      await api.delete(`/classes/${id}`)
      fetchClasses()
    } catch (error) {
      console.error('Failed to delete class:', error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Manage class records</p>
        </div>
        <Link to="/classes/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(classes) && classes.length > 0 ? (
          classes.map((cls) => (
            <div key={cls._id} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                <div className="flex gap-2">
                  <Link to={`/classes/${cls._id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(cls._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Sections:</span> {cls.sections?.join(', ') || '-'}</p>
                <p><span className="text-gray-500">Room:</span> {cls.roomNumber || '-'}</p>
                <p><span className="text-gray-500">Capacity:</span> {cls.capacity || '-'}</p>
                <p><span className="text-gray-500">Students:</span> {cls.currentStrength || 0}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">No classes found</div>
        )}
      </div>
    </div>
  )
}

export default ClassList
