import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const NoticeForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    targetType: 'all',
  })

  useEffect(() => {
    if (isEdit) fetchNotice()
  }, [id])

  const fetchNotice = async () => {
    try {
      const response = await api.get(`/notices/${id}`)
      setFormData(response.data.notice)
    } catch (error) {
      console.error('Failed to fetch notice:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/notices/${id}`, formData)
        toast.success('Notice updated successfully')
      } else {
        await api.post('/notices', formData)
        toast.success('Notice created successfully')
      }
      navigate('/notices')
    } catch (error) {
      toast.error('Failed to save notice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Notice' : 'Create Notice'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Title *</label>
          <input type="text" name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input" required />
        </div>

        <div>
          <label className="label">Content *</label>
          <textarea name="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="input" rows="6" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select name="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input">
              <option value="general">General</option>
              <option value="exam">Exam</option>
              <option value="holiday">Holiday</option>
              <option value="event">Event</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Target Audience</label>
          <select name="targetType" value={formData.targetType} onChange={(e) => setFormData({ ...formData, targetType: e.target.value })} className="input">
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
            <option value="parents">Parents</option>
          </select>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/notices')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Notice' : 'Create Notice'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NoticeForm
