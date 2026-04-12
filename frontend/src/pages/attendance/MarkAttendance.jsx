import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const MarkAttendance = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    classId: '',
    section: 'A',
    records: [],
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/attendance', formData)
      toast.success('Attendance marked successfully')
      navigate('/attendance')
    } catch (error) {
      toast.error('Failed to mark attendance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-600 mt-1">Record daily attendance for a class</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date *</label>
            <input type="date" name="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="label">Section *</label>
            <select name="section" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="input" required>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Note: Student list will be loaded based on selected class and section</p>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/attendance')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Mark Attendance'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MarkAttendance
