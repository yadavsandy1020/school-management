import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const TeacherForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    personalInfo: { firstName: '', lastName: '', dateOfBirth: '', gender: 'male' },
    contactInfo: { phone: '', email: '', address: { street: '', city: '', state: '', pincode: '' } },
    employmentDetails: { designation: '', joinDate: '', employmentType: 'permanent' },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/teachers', formData)
      toast.success('Teacher created successfully')
      navigate('/teachers')
    } catch (error) {
      toast.error('Failed to create teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name.includes('.')) {
        const [parent, child] = name.split('.')
        return { ...prev, [parent]: { ...prev[parent], [child]: value } }
      }
      return { ...prev, [name]: value }
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
        <p className="text-gray-600 mt-1">Fill in the teacher details</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Employee ID *</label>
            <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Designation *</label>
            <input type="text" name="employmentDetails.designation" value={formData.employmentDetails.designation} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">First Name *</label>
            <input type="text" name="personalInfo.firstName" value={formData.personalInfo.firstName} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input type="text" name="personalInfo.lastName" value={formData.personalInfo.lastName} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input type="tel" name="contactInfo.phone" value={formData.contactInfo.phone} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" name="contactInfo.email" value={formData.contactInfo.email} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="label">Join Date *</label>
            <input type="date" name="employmentDetails.joinDate" value={formData.employmentDetails.joinDate} onChange={handleChange} className="input" required />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/teachers')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Create Teacher'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TeacherForm
