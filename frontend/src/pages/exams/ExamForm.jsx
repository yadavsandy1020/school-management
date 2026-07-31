import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton } from '../../components/ui'
import { Plus, Trash2 } from 'lucide-react'

const ExamForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!!id)
  const [examTypes, setExamTypes] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [sessions, setSessions] = useState([])
  const [formData, setFormData] = useState({
    name: '', examType: '', academicSessionId: '', startDate: '', endDate: '', subjects: []
  })

  useEffect(() => {
    fetchExamTypes()
    fetchClasses()
    fetchSubjects()
    fetchSessions()
    if (id) fetchExam()
  }, [id])

  const fetchExamTypes = async () => { const res = await api.get('/exams/types'); setExamTypes(res.data.data) }
  const fetchClasses = async () => { const res = await api.get('/classes'); setClasses(res.data.data || res.data.classes) }
  const fetchSubjects = async () => { const res = await api.get('/subjects'); setSubjects(res.data.data || res.data.subjects) }
  const fetchSessions = async () => { const res = await api.get('/academic-sessions'); setSessions(res.data.data) }

  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${id}`)
      const exam = res.data.data
      setFormData({
        name: exam.name,
        examType: exam.examType?._id || exam.examType,
        academicSessionId: exam.academicSessionId?._id || exam.academicSessionId,
        startDate: exam.startDate?.split('T')[0],
        endDate: exam.endDate?.split('T')[0],
        subjects: exam.subjects.map(s => ({
          subjectId: s.subjectId?._id || s.subjectId,
          classId: s.classId?._id || s.classId,
          section: s.section || '',
          examDate: s.examDate?.split('T')[0] || '',
          startTime: s.startTime || '',
          endTime: s.endTime || '',
          maxMarks: s.maxMarks || 100,
          passingMarks: s.passingMarks || 33
        }))
      })
    } catch (error) { toast.error('Failed to load exam') } finally { setLoading(false) }
  }

  const addSubject = () => setFormData(prev => ({ ...prev, subjects: [...prev.subjects, { subjectId: '', classId: '', section: '', examDate: '', startTime: '', endTime: '', maxMarks: 100, passingMarks: 33 }] }))
  const removeSubject = (index) => setFormData(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }))
  const updateSubject = (index, field, value) => setFormData(prev => ({ ...prev, subjects: prev.subjects.map((s, i) => i === index ? { ...s, [field]: value } : s) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const tenantId = localStorage.getItem('tenantId')
      const schoolId = localStorage.getItem('schoolId')
      const payload = { ...formData, tenantId, schoolId }
      if (id) {
        await api.put(`/exams/${id}`, payload)
        toast.success('Exam updated')
      } else {
        await api.post('/exams', payload)
        toast.success('Exam created')
      }
      navigate('/exams')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save exam')
    }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Examinations" title={id ? 'Edit Exam' : 'Create Exam'} />

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Exam Name *</label>
            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" required />
          </div>
          <div>
            <label className="label">Exam Type *</label>
            <select value={formData.examType} onChange={e => setFormData({ ...formData, examType: e.target.value })} className="field" required>
              <option value="">Select Type</option>
              {examTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Academic Session</label>
            <select value={formData.academicSessionId} onChange={e => setFormData({ ...formData, academicSessionId: e.target.value })} className="field">
              <option value="">Select Session</option>
              {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Start Date *</label>
            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="field" required />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="field" required />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Subjects</h3>
            <button type="button" onClick={addSubject} className="btn btn-secondary h-8 gap-2 px-3 text-xs"><Plus className="h-3 w-3" /> Add Subject</button>
          </div>
          <div className="space-y-3">
            {formData.subjects.map((subject, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-7">
                <select value={subject.subjectId} onChange={e => updateSubject(index, 'subjectId', e.target.value)} className="field col-span-1 sm:col-span-2" required>
                  <option value="">Subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select value={subject.classId} onChange={e => updateSubject(index, 'classId', e.target.value)} className="field" required>
                  <option value="">Class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <input value={subject.section} onChange={e => updateSubject(index, 'section', e.target.value)} className="field" placeholder="Section" />
                <input type="date" value={subject.examDate} onChange={e => updateSubject(index, 'examDate', e.target.value)} className="field" />
                <input type="time" value={subject.startTime} onChange={e => updateSubject(index, 'startTime', e.target.value)} className="field" />
                <input type="number" value={subject.maxMarks} onChange={e => updateSubject(index, 'maxMarks', Number(e.target.value))} className="field" placeholder="Max" />
                <button type="button" onClick={() => removeSubject(index)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/exams')} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">{id ? 'Update Exam' : 'Create Exam'}</button>
        </div>
      </form>
    </div>
  )
}

export default ExamForm
