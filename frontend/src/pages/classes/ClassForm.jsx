import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

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
  })

  useEffect(() => {
    if (isEdit) fetchClass()
  }, [id])

  const fetchClass = async () => {
    try {
      const response = await api.get(`/classes/${id}`)
      setFormData(response.data.class)
    } catch (error) {
      console.error('Failed to fetch class:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      toast.error('Failed to save class')
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Class' : 'Add New Class'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Class Name *</label>
          <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Room Number</label>
            <input type="text" name="roomNumber" value={formData.roomNumber} onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} className="input" />
          </div>
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
