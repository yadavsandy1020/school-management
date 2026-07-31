import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, BookOpen, ArrowLeft } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, SelectField, InputField, TextAreaField } from '../../components/ui'

const HomeworkForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState({
    classId: '',
    section: '',
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    attachment: ''
  })

  useEffect(() => {
    fetchClasses()
    if (id) fetchHomework()
  }, [id])

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes')
      setClasses(data.data || data.classes || [])
    } catch (error) {
      toast.error('Failed to fetch classes')
    }
  }

  const fetchHomework = async () => {
    try {
      const { data } = await api.get(`/homework/${id}`)
      if (data.success && data.data) {
        const hw = data.data
        setFormData({
          classId: hw.classId?._id || hw.classId || '',
          section: hw.section || '',
          subject: hw.subject || '',
          title: hw.title || '',
          description: hw.description || '',
          dueDate: hw.dueDate ? new Date(hw.dueDate).toISOString().split('T')[0] : '',
          attachment: hw.attachment || ''
        })
      }
    } catch (error) {
      toast.error('Failed to fetch homework')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (id) {
        await api.put(`/homework/${id}`, formData)
        toast.success('Homework updated successfully')
      } else {
        await api.post('/homework', formData)
        toast.success('Homework assigned successfully')
      }
      navigate('/homework')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save homework')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const selectedClass = classes.find(c => c._id === formData.classId)
  const sections = selectedClass?.sections || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic"
        title={id ? 'Edit Homework' : 'Assign Homework'}
        description="Create homework assignments for classes and sections"
        actions={
          <button onClick={() => navigate('/homework')} className="btn btn-secondary gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to List
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="card !p-0">
        {/* Card Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="gradient-icon-box">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Homework Details</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Fill in the assignment information below</p>
          </div>
        </div>

        {/* Card Content */}
        <div className="space-y-6 p-6">
          {/* Class & Section */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SelectField
              label="Class"
              id="classId"
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              placeholder="Select class"
              options={classes.map(c => ({ value: c._id, label: c.name }))}
              required
            />
            <SelectField
              label="Section"
              id="section"
              name="section"
              value={formData.section}
              onChange={handleChange}
              placeholder="Select section"
              options={sections.map(s => ({ value: s, label: s }))}
              required
            />
          </div>

          {/* Subject & Title */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InputField
              label="Subject"
              id="subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Mathematics"
              required
            />
            <InputField
              label="Title"
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Chapter 5 Exercises"
              required
            />
          </div>

          {/* Description */}
          <TextAreaField
            label="Description"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Homework details, instructions, and requirements..."
            required
          />

          {/* Due Date & Attachment */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InputField
              label="Due Date"
              id="dueDate"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
            <InputField
              label="Attachment URL"
              id="attachment"
              name="attachment"
              type="text"
              value={formData.attachment}
              onChange={handleChange}
              placeholder="https://..."
              helper="Optional — link to external resource"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <button type="button" onClick={() => navigate('/homework')} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary gap-2">
              <Save className="h-4 w-4" /> {loading ? 'Saving...' : id ? 'Update Homework' : 'Assign Homework'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default HomeworkForm
