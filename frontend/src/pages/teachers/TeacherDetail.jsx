import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { Edit, ArrowLeft, Phone, Mail, Briefcase } from 'lucide-react'

const TeacherDetail = () => {
  const { id } = useParams()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeacher()
  }, [id])

  const fetchTeacher = async () => {
    try {
      const response = await api.get(`/teachers/${id}`)
      setTeacher(response.data.teacher)
    } catch (error) {
      console.error('Failed to fetch teacher:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!teacher) return <div className="text-center py-12"><p className="text-gray-600">Teacher not found</p></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/teachers" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Teachers
        </Link>
        <Link to={`/teachers/${id}/edit`} className="btn btn-primary inline-flex items-center">
          <Edit className="w-4 h-4 mr-2" /> Edit Teacher
        </Link>
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900">
          {teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName}
        </h1>
        <p className="text-gray-600 mt-1">Employee ID: {teacher.employeeId}</p>
        <p className="text-gray-600">{teacher.employmentDetails?.designation}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /><span>{teacher.contactInfo?.phone || '-'}</span></div>
            <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><span>{teacher.contactInfo?.email || '-'}</span></div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-gray-400" /><span>{teacher.employmentDetails?.designation}</span></div>
            <p>Join Date: {teacher.employmentDetails?.joinDate ? new Date(teacher.employmentDetails.joinDate).toLocaleDateString() : '-'}</p>
            <p>Type: {teacher.employmentDetails?.employmentType}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherDetail
