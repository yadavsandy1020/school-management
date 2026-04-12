import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Save } from 'lucide-react'

const CustomFieldsManager = () => {
  const [customFields, setCustomFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    type: 'text',
    options: '',
    appliesTo: 'student',
    required: false
  })

  useEffect(() => {
    fetchCustomFields()
  }, [])

  const fetchCustomFields = async () => {
    try {
      const response = await api.get('/customization')
      setCustomFields(response.data.school?.customFields || [])
    } catch (error) {
      console.error('Failed to fetch custom fields:', error)
    }
  }

  const handleAddField = () => {
    if (!newField.name) {
      toast.error('Field name is required')
      return
    }

    const field = {
      name: newField.name,
      type: newField.type,
      appliesTo: newField.appliesTo,
      required: newField.required
    }

    if (newField.type === 'select' || newField.type === 'checkbox') {
      field.options = newField.options.split(',').map(o => o.trim()).filter(o => o)
    }

    setCustomFields([...customFields, field])
    setNewField({ name: '', type: 'text', options: '', appliesTo: 'student', required: false })
  }

  const handleRemoveField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/customization/fields', { customFields })
      toast.success('Custom fields saved successfully')
    } catch (error) {
      toast.error('Failed to save custom fields')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h3>
        <p className="text-sm text-gray-600 mb-4">Add custom fields to student and teacher profiles</p>
      </div>

      {/* Add New Field */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Field Name</label>
            <input
              type="text"
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              className="input"
              placeholder="e.g., Blood Group"
            />
          </div>
          <div>
            <label className="label">Field Type</label>
            <select
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              className="input"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
            </select>
          </div>
          <div>
            <label className="label">Applies To</label>
            <select
              value={newField.appliesTo}
              onChange={(e) => setNewField({ ...newField, appliesTo: e.target.value })}
              className="input"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="label">Required</label>
            <select
              value={newField.required}
              onChange={(e) => setNewField({ ...newField, required: e.target.value === 'true' })}
              className="input"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
        {(newField.type === 'select' || newField.type === 'checkbox') && (
          <div className="mt-4">
            <label className="label">Options (comma-separated)</label>
            <input
              type="text"
              value={newField.options}
              onChange={(e) => setNewField({ ...newField, options: e.target.value })}
              className="input"
              placeholder="e.g., A+, A, B+, B, O+, O"
            />
          </div>
        )}
        <button
          onClick={handleAddField}
          className="btn btn-secondary mt-4 inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </button>
      </div>

      {/* Existing Fields */}
      {customFields.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-4">Current Custom Fields</h4>
          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{field.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <span className="px-2 py-0.5 bg-gray-200 rounded capitalize">{field.type}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded capitalize">{field.appliesTo}</span>
                    {field.required && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">Required</span>}
                  </div>
                  {field.options && field.options.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">Options: {field.options.join(', ')}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveField(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="btn btn-primary disabled:opacity-50 inline-flex items-center"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

export default CustomFieldsManager
