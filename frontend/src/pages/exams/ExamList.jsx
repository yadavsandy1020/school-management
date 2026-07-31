import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Plus, Calendar, FileText, Pencil, Trash2, Award } from 'lucide-react'

const ExamList = () => {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchExams() }, [])

  const fetchExams = async () => {
    try {
      const tenantId = localStorage.getItem('tenantId')
      const schoolId = localStorage.getItem('schoolId')
      const res = await api.get('/exams', { params: { tenantId, schoolId } })
      setExams(res.data.data)
    } catch (error) {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this exam?')) return
    try {
      await api.delete(`/exams/${id}`)
      toast.success('Exam deactivated')
      fetchExams()
    } catch (error) {
      toast.error('Failed to deactivate exam')
    }
  }

  const handlePublish = async (id) => {
    try {
      await api.post(`/exams/${id}/publish`)
      toast.success('Results published')
      fetchExams()
    } catch (error) {
      toast.error('Failed to publish results')
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic"
        title="Examinations"
        description="Schedule exams and manage results"
        actions={
          <Can permission="CLASS_MANAGE">
            <Link to="/exams/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> New Exam</Link>
          </Can>
        }
      />

      {exams.length === 0 ? (
        <EmptyState title="No exams scheduled" description="Create your first exam to get started" action={
          <Can permission="CLASS_MANAGE"><Link to="/exams/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> New Exam</Link></Can>
        } />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map(exam => (
            <div key={exam._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{exam.name}</p>
                    <p className="text-xs text-slate-400">{exam.examType?.name}</p>
                  </div>
                </div>
                {exam.isResultPublished && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Published</span>}
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{exam.subjects?.length || 0} subjects scheduled</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Can permission="ATTENDANCE_MARK">
                  <Link to={`/exams/${exam._id}/marks`} className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs">
                    <FileText className="h-3 w-3" /> Marks
                  </Link>
                </Can>
                <Can permission="CLASS_MANAGE">
                  <Link to={`/exams/${exam._id}/edit`} className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs">
                    <Pencil className="h-3 w-3" /> Edit
                  </Link>
                  {!exam.isResultPublished && (
                    <button onClick={() => handlePublish(exam._id)} className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs text-emerald-600">
                      <Award className="h-3 w-3" /> Publish
                    </button>
                  )}
                  <button onClick={() => handleDelete(exam._id)} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExamList
