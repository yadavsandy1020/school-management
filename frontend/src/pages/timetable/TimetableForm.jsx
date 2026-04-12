import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Clock } from 'lucide-react'

const TimetableForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    classId: '',
    section: 'A',
    day: 'monday',
    academicSession: new Date().getFullYear().toString(),
    periods: [{ periodNumber: 1, startTime: '08:00', endTime: '08:45', subjectId: '', teacherId: '', room: '' }]
  })

  const handleAddPeriod = () => {
    const lastPeriod = formData.periods[formData.periods.length - 1]
    setFormData({
      ...formData,
      periods: [
        ...formData.periods,
        {
          periodNumber: lastPeriod ? lastPeriod.periodNumber + 1 : 1,
          startTime: '',
          endTime: '',
          subjectId: '',
          teacherId: '',
          room: ''
        }
      ]
    })
  }

  const handleRemovePeriod = (index) => {
    setFormData({
      ...formData,
      periods: formData.periods.filter((_, i) => i !== index)
    })
  }

  const handlePeriodChange = (index, field, value) => {
    const updatedPeriods = [...formData.periods]
    updatedPeriods[index][field] = value
    setFormData({ ...formData, periods: updatedPeriods })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/timetable/${id}`, formData)
        toast.success('Timetable updated successfully')
      } else {
        await api.post('/timetable', formData)
        toast.success('Timetable created successfully')
      }
      navigate('/timetable')
    } catch (error) {
      toast.error('Failed to save timetable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Timetable' : 'Add New Timetable'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Class *</label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select Class</option>
              <option value="class1">Class 1</option>
              <option value="class2">Class 2</option>
            </select>
          </div>
          <div>
            <label className="label">Section *</label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="input"
              required
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div>
            <label className="label">Day *</label>
            <select
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              className="input"
              required
            >
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Periods</h3>
            <button type="button" onClick={handleAddPeriod} className="btn btn-secondary text-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Period
            </button>
          </div>

          <div className="space-y-4">
            {formData.periods.map((period, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">Period {period.periodNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePeriod(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="label text-sm">Start Time</label>
                    <input
                      type="time"
                      value={period.startTime}
                      onChange={(e) => handlePeriodChange(index, 'startTime', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label text-sm">End Time</label>
                    <input
                      type="time"
                      value={period.endTime}
                      onChange={(e) => handlePeriodChange(index, 'endTime', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Subject</label>
                    <select
                      value={period.subjectId}
                      onChange={(e) => handlePeriodChange(index, 'subjectId', e.target.value)}
                      className="input"
                    >
                      <option value="">Select Subject</option>
                      <option value="math">Math</option>
                      <option value="science">Science</option>
                      <option value="english">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Teacher</label>
                    <select
                      value={period.teacherId}
                      onChange={(e) => handlePeriodChange(index, 'teacherId', e.target.value)}
                      className="input"
                    >
                      <option value="">Select Teacher</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Room</label>
                    <input
                      type="text"
                      value={period.room}
                      onChange={(e) => handlePeriodChange(index, 'room', e.target.value)}
                      className="input"
                      placeholder="Room No."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/timetable')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Timetable'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TimetableForm
