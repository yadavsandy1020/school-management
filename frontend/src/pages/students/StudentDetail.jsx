import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { Edit, ArrowLeft, Phone, Mail, MapPin, Calendar, User } from 'lucide-react'

const StudentDetail = () => {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudent()
  }, [id])

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/students/${id}`)
      setStudent(response.data.student)
    } catch (error) {
      console.error('Failed to fetch student:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Student not found</p>
        <Link to="/students" className="btn btn-primary mt-4">
          Back to Students
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/students" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Students
        </Link>
        <Link
          to={`/students/${id}/edit`}
          className="btn btn-primary inline-flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Student
        </Link>
      </div>

      {/* Student Header */}
      <div className="card">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {student.personalInfo?.firstName} {student.personalInfo?.lastName}
            </h1>
            <p className="text-gray-600 mt-1">Admission No: {student.admissionNo}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {student.classId?.name || '-'} - {student.section}
              </span>
              <span className="text-sm text-gray-500">
                Session: {student.academicSession}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">
                  {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {student.personalInfo?.dateOfBirth
                    ? new Date(student.personalInfo.dateOfBirth).toLocaleDateString()
                    : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium capitalize">{student.personalInfo?.gender || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="font-medium">{student.personalInfo?.bloodGroup || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{student.contactInfo?.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{student.contactInfo?.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {student.contactInfo?.address?.street}, {student.contactInfo?.address?.city},{' '}
                  {student.contactInfo?.address?.state} - {student.contactInfo?.address?.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Father</h4>
              <div className="space-y-2">
                <p>
                  <span className="text-sm text-gray-500">Name:</span>{' '}
                  <span className="font-medium">{student.parentInfo?.fatherName || '-'}</span>
                </p>
                <p>
                  <span className="text-sm text-gray-500">Phone:</span>{' '}
                  <span className="font-medium">{student.parentInfo?.fatherPhone || '-'}</span>
                </p>
                <p>
                  <span className="text-sm text-gray-500">Occupation:</span>{' '}
                  <span className="font-medium">{student.parentInfo?.fatherOccupation || '-'}</span>
                </p>
                <p>
                  <span className="text-sm text-gray-500">Email:</span>{' '}
                  <span className="font-medium">{student.parentInfo?.fatherEmail || '-'}</span>
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Mother</h4>
              <div className="space-y-2">
                <p>
                  <span className="text-sm text-gray-500">Name:</span>{' '}
                  <span className="font-medium">{student.parentInfo?.motherName || '-'}</span>
                </p>
                <p>
                  <span className="text-sm text-gray-500">Phone:</span>{' '}
                  <span className="font-medium">{student.parentInfo?.motherPhone || '-'}</span>
                </p>
                <p>
                  <span className="text-sm text-gray-500">Occupation:</span>{' '}
                  <span className="font-medium">{student.parentInfo?.motherOccupation || '-'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDetail
