import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { User, Calendar, DollarSign, Bell } from 'lucide-react'

const ParentDashboard = () => {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const response = await api.get('/students')
      setChildren(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch children:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
        <p className="text-gray-600 mt-1">Monitor your child's progress</p>
      </div>

      {children.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No children linked to your account</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <div key={child._id} className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {child.personalInfo?.firstName} {child.personalInfo?.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{child.classId?.name} - {child.section}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full btn btn-secondary text-sm flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Attendance
                </button>
                <button className="w-full btn btn-secondary text-sm flex items-center justify-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Fees
                </button>
                <button className="w-full btn btn-secondary text-sm flex items-center justify-center">
                  <Bell className="w-4 h-4 mr-2" />
                  View Notices
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ParentDashboard
