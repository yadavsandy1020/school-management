import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const MarkAttendance = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    classId: '',
    section: 'A',
  })

  useEffect(() => { fetchClasses() }, [])

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes')
      setClasses(data.data || data.classes || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchStudents = async () => {
    if (!formData.classId) return
    try {
      const { data } = await api.get(`/students?classId=${formData.classId}&section=${formData.section}`)
      const studentList = data.data || data.students || []
      setStudents(studentList.map(s => ({
        studentId: s._id,
        name: `${s.personalInfo?.firstName} ${s.personalInfo?.lastName}`,
        rollNo: s.rollNo || '-',
        status: 'present'
      })))
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  useEffect(() => { if (formData.classId) fetchStudents() }, [formData.classId, formData.section])

  const handleStatusChange = (idx, status) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, status } : s))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (students.length === 0) { toast.error('No students found for this class/section'); return }
    setLoading(true)
    try {
      await api.post('/attendance', {
        date: formData.date,
        classId: formData.classId,
        section: formData.section,
        records: students.map(s => ({ studentId: s.studentId, status: s.status }))
      })
      toast.success('Attendance marked successfully')
      navigate('/attendance')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark attendance')
    } finally {
      setLoading(false)
    }
  }

  const selectedClass = classes.find(c => c._id === formData.classId)
  const sections = selectedClass?.sections || []

  const statusButtons = [
    { value: 'present', label: 'Present', icon: CheckCircle, color: 'green' },
    { value: 'absent', label: 'Absent', icon: XCircle, color: 'red' },
    { value: 'late', label: 'Late', icon: Clock, color: 'amber' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mark Attendance</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Record daily attendance for a class</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" name="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="field" required />
          </div>
          <div>
            <label className="label">Class</label>
            <select name="classId" value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className="field" required>
              <option value="">Select class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select name="section" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="field" required>
              {sections.length > 0 ? sections.map(s => <option key={s} value={s}>{s}</option>) : <option value="A">A</option>}
            </select>
          </div>
        </div>

        {students.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Roll No</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Student Name</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.studentId} className="border-b hover:bg-slate-50 dark:bg-slate-800/30">
                    <td className="py-3 px-4 text-sm">{student.rollNo}</td>
                    <td className="py-3 px-4 text-sm font-medium">{student.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        {statusButtons.map(btn => (
                          <button
                            key={btn.value}
                            type="button"
                            onClick={() => handleStatusChange(idx, btn.value)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              student.status === btn.value
                                ? btn.color === 'green' ? 'bg-green-600 text-white'
                                  : btn.color === 'red' ? 'bg-red-600 text-white'
                                  : 'bg-amber-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <btn.icon className="h-3 w-3" /> {btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {formData.classId && students.length === 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center text-slate-500 dark:text-slate-400">
            No students found for this class and section
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/attendance')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading || students.length === 0} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Mark Attendance'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MarkAttendance
