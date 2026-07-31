import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton } from '../../components/ui'

const MarksEntry = () => {
  const { id: examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchExam() }, [examId])

  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${examId}`)
      setExam(res.data.data)
      if (res.data.data.subjects?.length) {
        setSelectedSubject(res.data.data.subjects[0].subjectId?._id || res.data.data.subjects[0].subjectId)
      }
    } catch (error) {
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedSubject) fetchDataForSubject()
  }, [selectedSubject])

  const fetchDataForSubject = async () => {
    const subject = exam.subjects.find(s => (s.subjectId?._id || s.subjectId) === selectedSubject)
    if (!subject) return

    const classId = subject.classId?._id || subject.classId
    const section = subject.section || ''

    try {
      const [studentsRes, marksRes] = await Promise.all([
        api.get(`/exams/${examId}/students`, { params: { classId, section } }),
        api.get('/exams/marks', { params: { examId, classId, section, subjectId: selectedSubject } })
      ])
      setStudents(studentsRes.data.data)

      const existingMarks = {}
      marksRes.data.data.forEach(m => {
        existingMarks[m.studentId._id || m.studentId] = {
          marksObtained: m.marksObtained,
          maxMarks: m.maxMarks,
          isAbsent: m.isAbsent
        }
      })
      setMarks(existingMarks)
    } catch (error) {
      toast.error('Failed to load students or marks')
    }
  }

  const updateMark = (studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], marksObtained: Number(value) } }))
  }

  const toggleAbsent = (studentId) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], isAbsent: !prev[studentId]?.isAbsent } }))
  }

  const handleSave = async () => {
    try {
      const subject = exam.subjects.find(s => (s.subjectId?._id || s.subjectId) === selectedSubject)
      const classId = subject.classId?._id || subject.classId
      const section = subject.section || ''
      const maxMarks = subject.maxMarks || 100

      const payload = Object.entries(marks).map(([studentId, data]) => ({
        examId,
        studentId,
        subjectId: selectedSubject,
        classId,
        section,
        maxMarks,
        marksObtained: data.isAbsent ? 0 : data.marksObtained,
        isAbsent: data.isAbsent || false
      }))

      await api.post('/exams/marks', { marks: payload })
      toast.success('Marks saved successfully')
      navigate('/exams')
    } catch (error) {
      toast.error('Failed to save marks')
    }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
  if (!exam) return null

  const currentSubject = exam.subjects.find(s => (s.subjectId?._id || s.subjectId) === selectedSubject)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Examinations" title={`Marks Entry - ${exam.name}`} description={currentSubject ? `Subject: ${currentSubject.subjectId?.name || 'Subject'}` : ''} />

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="label mb-1">Select Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="field sm:w-64">
            {exam.subjects.map(s => (
              <option key={s.subjectId?._id || s.subjectId} value={s.subjectId?._id || s.subjectId}>
                {s.subjectId?.name} - {s.classId?.name} {s.section && `(${s.section})`}
              </option>
            ))}
          </select>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No students found for this class/section.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No</th>
                  <th>Marks ({currentSubject?.maxMarks || 100})</th>
                  <th>Absent</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student._id}>
                    <td>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.email}</p>
                    </td>
                    <td className="text-xs text-slate-400">{student.studentDetails?.admissionNo || '—'}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={currentSubject?.maxMarks || 100}
                        value={marks[student._id]?.marksObtained || ''}
                        onChange={e => updateMark(student._id, e.target.value)}
                        disabled={marks[student._id]?.isAbsent}
                        className="field h-9 w-24 py-1"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={marks[student._id]?.isAbsent || false}
                        onChange={() => toggleAbsent(student._id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={() => navigate('/exams')} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={students.length === 0} className="btn btn-primary">Save Marks</button>
        </div>
      </div>
    </div>
  )
}

export default MarksEntry
