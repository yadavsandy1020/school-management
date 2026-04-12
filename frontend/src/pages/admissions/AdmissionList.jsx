import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, UserPlus, Check, X } from 'lucide-react'

const AdmissionList = () => {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdmissions()
  }, [])

  const fetchAdmissions = async () => {
    try {
      const response = await api.get('/admissions')
      setAdmissions(response.data.data || response.data)
    } catch (error) {
      console.error('Failed to fetch admissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      await api.put(`/admissions/${id}/${action}`)
      fetchAdmissions()
    } catch (error) {
      console.error(`Failed to ${action} admission:`, error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admissions</h1>
          <p className="text-gray-600 mt-1">Manage admission applications</p>
        </div>
        <Link to="/admissions/new" className="btn btn-primary inline-flex items-center">
          <UserPlus className="w-4 h-4 mr-2" /> New Application
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Application No</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(admissions) && admissions.length > 0 ? (
              admissions.map((admission) => (
                <tr key={admission._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{admission.applicationNo}</td>
                  <td className="py-3 px-4">{admission.studentInfo?.firstName} {admission.studentInfo?.lastName}</td>
                  <td className="py-3 px-4">{admission.classApplied?.name || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      admission.status === 'approved' ? 'bg-green-100 text-green-700' :
                      admission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      admission.status === 'enrolled' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {admission.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {admission.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(admission._id, 'review')} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Review">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleAction(admission._id, 'reject')} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Reject">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {admission.status === 'approved' && (
                        <button onClick={() => window.location.href = `/admissions/${admission._id}`} className="text-sm text-blue-600 hover:underline">Enroll</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="py-8 text-center text-gray-500">No admissions found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdmissionList
