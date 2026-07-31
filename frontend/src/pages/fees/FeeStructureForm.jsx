import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const FeeStructureForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    academicSession: new Date().getFullYear().toString(),
    fees: [{ type: 'tuition', name: 'Tuition Fee', amount: 1000 }],
  })

  useEffect(() => {
    fetchClasses()
    if (isEdit) fetchStructure()
  }, [id])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes?limit=100')
      setClasses(response.data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load classes')
    }
  }

  const fetchStructure = async () => {
    try {
      const response = await api.get(`/fees/structure/${id}`)
      const feeStructure = response.data.feeStructure
      setFormData({
        ...feeStructure,
        classId: feeStructure.classId?._id || feeStructure.classId || ''
      })
    } catch (error) {
      console.error('Failed to fetch fee structure:', error)
    }
  }

  const addFeeItem = () => {
    setFormData({ ...formData, fees: [...formData.fees, { type: 'tuition', name: '', amount: 0 }] })
  }

  const removeFeeItem = (index) => {
    setFormData({ ...formData, fees: formData.fees.filter((_, i) => i !== index) })
  }

  const updateFeeItem = (index, field, value) => {
    const updatedFees = [...formData.fees]
    updatedFees[index][field] = value
    setFormData({ ...formData, fees: updatedFees })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/fees/structure/${id}`, formData)
        toast.success('Fee structure updated successfully')
      } else {
        await api.post('/fees/structure', formData)
        toast.success('Fee structure created successfully')
      }
      navigate('/fees/structure')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save fee structure')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Fee Structure' : 'Add Fee Structure'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="label">Class *</label>
            <select name="classId" value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className="input" required>
              <option value="">Select a class</option>
              {classes.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>{classItem.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Academic Session *</label>
            <input type="text" name="academicSession" value={formData.academicSession} onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })} className="input" required />
          </div>
        </div>

        <div>
          <label className="label">Fee Items</label>
          <div className="space-y-3">
            {formData.fees.map((fee, index) => (
              <div key={index} className="flex gap-2">
                <input type="text" placeholder="Fee name" value={fee.name} onChange={(e) => updateFeeItem(index, 'name', e.target.value)} className="input flex-1" />
                <input type="number" placeholder="Amount" value={fee.amount} onChange={(e) => updateFeeItem(index, 'amount', parseFloat(e.target.value))} className="input w-32" />
                <button type="button" onClick={() => removeFeeItem(index)} className="btn btn-danger">Remove</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addFeeItem} className="mt-2 text-sm text-primary-600 hover:underline">+ Add Fee Item</button>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/fees/structure')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Fee Structure'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FeeStructureForm
