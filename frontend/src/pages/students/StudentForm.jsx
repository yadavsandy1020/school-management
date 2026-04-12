import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const StudentForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    admissionNo: '',
    rollNo: '',
    classId: '',
    section: 'A',
    academicSession: new Date().getFullYear().toString(),
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      bloodGroup: '',
    },
    contactInfo: {
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
      },
      phone: '',
      email: '',
    },
    parentInfo: {
      fatherName: '',
      fatherPhone: '',
      fatherOccupation: '',
      fatherEmail: '',
      motherName: '',
      motherPhone: '',
      motherOccupation: '',
    },
  })

  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchClasses()
    if (isEdit) {
      fetchStudent()
    }
  }, [id])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes')
      setClasses(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/students/${id}`)
      setFormData(response.data.student)
    } catch (error) {
      console.error('Failed to fetch student:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit) {
        await api.put(`/students/${id}`, formData)
        toast.success('Student updated successfully')
      } else {
        await api.post('/students', formData)
        toast.success('Student created successfully')
      }
      navigate('/students')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save student')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name.includes('.')) {
        const [parent, child] = name.split('.')
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }
      }
      return { ...prev, [name]: value }
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Student' : 'Add New Student'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update student information' : 'Fill in the student details'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-8">
        {/* Academic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Admission Number *</label>
              <input
                type="text"
                name="admissionNo"
                value={formData.admissionNo}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Roll Number</label>
              <input
                type="text"
                name="rollNo"
                value={formData.rollNo}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Class *</label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Section *</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                name="personalInfo.firstName"
                value={formData.personalInfo.firstName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                type="text"
                name="personalInfo.lastName"
                value={formData.personalInfo.lastName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Date of Birth *</label>
              <input
                type="date"
                name="personalInfo.dateOfBirth"
                value={formData.personalInfo.dateOfBirth}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select
                name="personalInfo.gender"
                value={formData.personalInfo.gender}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Blood Group</label>
              <input
                type="text"
                name="personalInfo.bloodGroup"
                value={formData.personalInfo.bloodGroup}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Street Address</label>
              <input
                type="text"
                name="contactInfo.address.street"
                value={formData.contactInfo.address.street}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                name="contactInfo.address.city"
                value={formData.contactInfo.address.city}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">State</label>
              <input
                type="text"
                name="contactInfo.address.state"
                value={formData.contactInfo.address.state}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input
                type="text"
                name="contactInfo.address.pincode"
                value={formData.contactInfo.address.pincode}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input
                type="tel"
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="contactInfo.email"
                value={formData.contactInfo.email}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Father's Name *</label>
              <input
                type="text"
                name="parentInfo.fatherName"
                value={formData.parentInfo.fatherName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Father's Phone *</label>
              <input
                type="tel"
                name="parentInfo.fatherPhone"
                value={formData.parentInfo.fatherPhone}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Father's Occupation</label>
              <input
                type="text"
                name="parentInfo.fatherOccupation"
                value={formData.parentInfo.fatherOccupation}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Father's Email</label>
              <input
                type="email"
                name="parentInfo.fatherEmail"
                value={formData.parentInfo.fatherEmail}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Mother's Name</label>
              <input
                type="text"
                name="parentInfo.motherName"
                value={formData.parentInfo.motherName}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Mother's Phone</label>
              <input
                type="tel"
                name="parentInfo.motherPhone"
                value={formData.parentInfo.motherPhone}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default StudentForm
