import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const TeacherForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    personalInfo: { firstName: '', lastName: '', dateOfBirth: '', gender: 'male' },
    contactInfo: { phone: '', email: '', address: { street: '', city: '', state: '', pincode: '' } },
    employmentDetails: { designation: '', joinDate: '', employmentType: 'permanent' },
    salaryDetails: { basicSalary: '', allowances: { da: '', hra: '', ta: '', others: '' }, totalSalary: 0 },
  })

  useEffect(() => {
    if (!isEdit) return

    const fetchTeacher = async () => {
      try {
        const response = await api.get(`/teachers/${id}`)
        const teacher = response.data.teacher
        setFormData({
          ...teacher,
          personalInfo: {
            ...teacher.personalInfo,
            dateOfBirth: teacher.personalInfo?.dateOfBirth?.slice(0, 10) || ''
          },
          employmentDetails: {
            ...teacher.employmentDetails,
            joinDate: teacher.employmentDetails?.joinDate?.slice(0, 10) || ''
          },
          salaryDetails: {
            basicSalary: '',
            totalSalary: 0,
            ...(teacher.salaryDetails || {}),
            allowances: {
              da: '', hra: '', ta: '', others: '',
              ...(teacher.salaryDetails?.allowances || {})
            }
          }
        })
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load teacher')
      }
    }

    fetchTeacher()
  }, [id, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        employeeId: formData.employeeId,
        personalInfo: formData.personalInfo,
        contactInfo: formData.contactInfo,
        employmentDetails: formData.employmentDetails,
        salaryDetails: formData.salaryDetails
      }
      if (isEdit) {
        await api.put(`/teachers/${id}`, payload)
        toast.success('Teacher updated successfully')
      } else {
        await api.post('/teachers', payload)
        toast.success('Teacher created successfully')
      }
      navigate('/teachers')
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} teacher`)
    } finally {
      setLoading(false)
    }
  }

  const setNestedValue = (obj, path, value) => {
    const [head, ...rest] = path.split('.')
    if (rest.length === 0) {
      return { ...obj, [head]: value }
    }
    return { ...obj, [head]: setNestedValue(obj?.[head] || {}, rest.join('.'), value) }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => setNestedValue(prev, name, value))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Teacher' : 'Add New Teacher'}</h1>
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

        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Salary Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Basic Salary (₹)</label><input type="number" name="salaryDetails.basicSalary" value={formData.salaryDetails?.basicSalary || ''} onChange={handleChange} className="input" /></div>
            <div><label className="label">DA (₹)</label><input type="number" name="salaryDetails.allowances.da" value={formData.salaryDetails?.allowances?.da || ''} onChange={handleChange} className="input" /></div>
            <div><label className="label">HRA (₹)</label><input type="number" name="salaryDetails.allowances.hra" value={formData.salaryDetails?.allowances?.hra || ''} onChange={handleChange} className="input" /></div>
            <div><label className="label">TA (₹)</label><input type="number" name="salaryDetails.allowances.ta" value={formData.salaryDetails?.allowances?.ta || ''} onChange={handleChange} className="input" /></div>
            <div><label className="label">Others (₹)</label><input type="number" name="salaryDetails.allowances.others" value={formData.salaryDetails?.allowances?.others || ''} onChange={handleChange} className="input" /></div>
            <div className="flex items-end">
              <div className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase">Calculated Total</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  ₹{((Number(formData.salaryDetails?.basicSalary) || 0) + (Number(formData.salaryDetails?.allowances?.da) || 0) + (Number(formData.salaryDetails?.allowances?.hra) || 0) + (Number(formData.salaryDetails?.allowances?.ta) || 0) + (Number(formData.salaryDetails?.allowances?.others) || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/teachers')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Teacher' : 'Create Teacher'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TeacherForm
