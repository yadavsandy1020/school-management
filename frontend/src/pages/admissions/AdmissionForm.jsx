import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const AdmissionForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    studentInfo: { firstName: '', lastName: '', dateOfBirth: '', gender: 'male' },
    parentInfo: { fatherName: '', fatherPhone: '' },
    classApplied: '',
  })

  useEffect(() => {
    if (isEdit) fetchAdmission()
  }, [id])

  const fetchAdmission = async () => {
    try {
      const response = await api.get(`/admissions/${id}`)
      setFormData(response.data.admission)
    } catch (error) {
      console.error('Failed to fetch admission:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/admissions/${id}`, formData)
        toast.success('Admission updated successfully')
      } else {
        await api.post('/admissions', formData)
        toast.success('Application submitted successfully')
      }
      navigate('/admissions')
    } catch (error) {
      toast.error('Failed to save admission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Admission' : 'New Admission Application'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input type="text" value={formData.studentInfo?.firstName} onChange={(e) => setFormData({ ...formData, studentInfo: { ...formData.studentInfo, firstName: e.target.value } })} className="input" required />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input type="text" value={formData.studentInfo?.lastName} onChange={(e) => setFormData({ ...formData, studentInfo: { ...formData.studentInfo, lastName: e.target.value } })} className="input" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Father's Name *</label>
            <input type="text" value={formData.parentInfo?.fatherName} onChange={(e) => setFormData({ ...formData, parentInfo: { ...formData.parentInfo, fatherName: e.target.value } })} className="input" required />
          </div>
          <div>
            <label className="label">Father's Phone *</label>
            <input type="tel" value={formData.parentInfo?.fatherPhone} onChange={(e) => setFormData({ ...formData, parentInfo: { ...formData.parentInfo, fatherPhone: e.target.value } })} className="input" required />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admissions')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdmissionForm
