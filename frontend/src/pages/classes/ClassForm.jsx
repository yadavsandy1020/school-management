import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

const FEE_TYPES = [
  { value: 'tuition', label: 'Tuition' },
  { value: 'admission', label: 'Admission' },
  { value: 'library', label: 'Library' },
  { value: 'lab', label: 'Lab' },
  { value: 'sports', label: 'Sports' },
  { value: 'transport', label: 'Transport' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'exam', label: 'Exam' },
  { value: 'other', label: 'Other' },
]

const ClassForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sections: ['A'],
    roomNumber: '',
    capacity: 40,
    fees: [{ type: 'tuition', name: 'Tuition Fee', amount: 0, frequency: 'yearly' }],
    installments: [
      { label: '1st Installment (At Admission)', dueDate: '', percentage: 40 },
      { label: '2nd Installment (By October)', dueDate: '', percentage: 30 },
      { label: '3rd Installment (By January 1st Week)', dueDate: '', percentage: 30 },
    ],
  })

  useEffect(() => {
    if (isEdit) fetchClass()
  }, [id])

  const fetchClass = async () => {
    try {
      const response = await api.get(`/classes/${id}`)
      const classData = response.data.class
      setFormData({
        name: classData.name || '',
        sections: classData.sections || ['A'],
        roomNumber: classData.roomNumber || '',
        capacity: classData.capacity || 40,
        fees: classData.feeStructure?.fees || [{ type: 'tuition', name: 'Tuition Fee', amount: 0, frequency: 'yearly' }],
        installments: classData.feeStructure?.installments?.length > 0
          ? classData.feeStructure.installments.map(inst => ({
              label: inst.label,
              dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString().split('T')[0] : '',
              percentage: inst.percentage,
            }))
          : [
              { label: '1st Installment (At Admission)', dueDate: '', percentage: 40 },
              { label: '2nd Installment (By October)', dueDate: '', percentage: 30 },
              { label: '3rd Installment (By January 1st Week)', dueDate: '', percentage: 30 },
            ],
      })
    } catch (error) {
      console.error('Failed to fetch class:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const totalPct = formData.installments.reduce((sum, inst) => sum + Number(inst.percentage || 0), 0)
    if (formData.installments.length > 0 && totalPct !== 100) {
      toast.error('Installment percentages must add up to 100%')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/classes/${id}`, formData)
        toast.success('Class updated successfully')
      } else {
        await api.post('/classes', formData)
        toast.success('Class created successfully')
      }
      navigate('/classes')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save class')
    } finally {
      setLoading(false)
    }
  }

  const addSection = () => {
    setFormData({ ...formData, sections: [...formData.sections, String.fromCharCode(65 + formData.sections.length)] })
  }

  const removeSection = (index) => {
    if (formData.sections.length > 1) {
      setFormData({ ...formData, sections: formData.sections.filter((_, i) => i !== index) })
    }
  }

  const addFeeItem = () => {
    setFormData({
      ...formData,
      fees: [...formData.fees, { type: 'tuition', name: '', amount: 0, frequency: 'yearly' }],
    })
  }

  const removeFeeItem = (index) => {
    setFormData({ ...formData, fees: formData.fees.filter((_, i) => i !== index) })
  }

  const updateFeeItem = (index, field, value) => {
    const updatedFees = [...formData.fees]
    updatedFees[index][field] = value
    setFormData({ ...formData, fees: updatedFees })
  }

  const totalFees = formData.fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0)
  const totalPercentage = formData.installments.reduce((sum, inst) => sum + Number(inst.percentage || 0), 0)

  const addInstallment = () => {
    setFormData({
      ...formData,
      installments: [...formData.installments, { label: '', dueDate: '', percentage: 0 }],
    })
  }

  const removeInstallment = (index) => {
    if (formData.installments.length > 1) {
      setFormData({ ...formData, installments: formData.installments.filter((_, i) => i !== index) })
    }
  }

  const updateInstallment = (index, field, value) => {
    const updated = [...formData.installments]
    updated[index][field] = value
    setFormData({ ...formData, installments: updated })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Class' : 'Add New Class'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Class Name *</label>
          <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="field" required />
        </div>

        <div>
          <label className="label">Sections</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.sections.map((section, index) => (
              <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full flex items-center gap-2">
                {section}
                <button type="button" onClick={() => removeSection(index)} className="text-primary-600 hover:text-primary-800">×</button>
              </span>
            ))}
          </div>
          <button type="button" onClick={addSection} className="text-sm text-primary-600 hover:underline">+ Add Section</button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Room Number</label>
            <input type="text" name="roomNumber" value={formData.roomNumber} onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} className="field" />
          </div>
        </div>

        {/* Fee Structure Section */}
        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fee Structure</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Define fee items for this class</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">₹{totalFees.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            {formData.fees.map((fee, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
                <select
                  value={fee.type}
                  onChange={(e) => updateFeeItem(index, 'type', e.target.value)}
                  className="field sm:col-span-3"
                >
                  {FEE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Fee name"
                  value={fee.name}
                  onChange={(e) => updateFeeItem(index, 'name', e.target.value)}
                  className="field sm:col-span-4"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={fee.amount}
                  onChange={(e) => updateFeeItem(index, 'amount', parseFloat(e.target.value) || 0)}
                  className="field sm:col-span-3"
                />
                <button
                  type="button"
                  onClick={() => removeFeeItem(index)}
                  className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg sm:col-span-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addFeeItem}
            className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:underline"
          >
            <Plus className="h-4 w-4" /> Add Fee Item
          </button>
        </div>

        {/* Installment Schedule Section */}
        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Installment Schedule</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Split total fee into installments. First installment at admission, last by January 1st week.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total %</p>
              <p className={`text-lg font-bold ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>{totalPercentage}%</p>
            </div>
          </div>

          <div className="space-y-3">
            {formData.installments.map((inst, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
                <input
                  type="text"
                  placeholder="Installment label (e.g. 1st Installment)"
                  value={inst.label}
                  onChange={(e) => updateInstallment(index, 'label', e.target.value)}
                  className="field sm:col-span-5"
                />
                <input
                  type="date"
                  value={inst.dueDate}
                  onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                  className="field sm:col-span-3"
                />
                <div className="relative sm:col-span-2">
                  <input
                    type="number"
                    placeholder="%"
                    value={inst.percentage}
                    onChange={(e) => updateInstallment(index, 'percentage', parseFloat(e.target.value) || 0)}
                    className="field pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeInstallment(index)}
                  className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg sm:col-span-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addInstallment}
            className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:underline"
          >
            <Plus className="h-4 w-4" /> Add Installment
          </button>
          {totalPercentage !== 100 && (
            <p className="mt-2 text-xs text-red-500">Installment percentages must add up to 100%</p>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/classes')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Class' : 'Create Class'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ClassForm
