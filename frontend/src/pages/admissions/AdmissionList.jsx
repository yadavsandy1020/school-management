import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Check, X, Eye } from 'lucide-react'
import { PageHeader, Skeleton, EmptyState, StatusBadge } from '../../components/ui'

const AdmissionList = () => {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAdmissions() }, [])

  const fetchAdmissions = async () => {
    try { const response = await api.get('/admissions'); setAdmissions(response.data.data || response.data) } catch (error) { console.error('Failed to fetch admissions:', error) } finally { setLoading(false) }
  }

  const handleAction = async (id, action) => {
    try {
      const method = action === 'enroll' ? 'post' : 'put'
      await api[method](`/admissions/${id}/${action}`)
      fetchAdmissions()
    } catch (error) { console.error(`Failed to ${action} admission:`, error) }
  }

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>

  const ActionButtons = ({ admission }) => {
    const status = admission.status
    const base = 'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition'
    const btnView = `${base} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700`
    const btnReview = `${base} bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300`
    const btnApprove = `${base} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300`
    const btnReject = `${base} bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300`

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link to={`/admissions/${admission._id}`} className={btnView}><Eye className="h-3.5 w-3.5" />View</Link>
        {status === 'pending' && (
          <>
            <button onClick={() => handleAction(admission._id, 'review')} className={btnReview}><Check className="h-3.5 w-3.5" />Review</button>
            <button onClick={() => handleAction(admission._id, 'reject')} className={btnReject}><X className="h-3.5 w-3.5" />Reject</button>
          </>
        )}
        {status === 'under_review' && (
          <>
            <button onClick={() => handleAction(admission._id, 'approve')} className={btnApprove}><Check className="h-3.5 w-3.5" />Approve</button>
            <button onClick={() => handleAction(admission._id, 'reject')} className={btnReject}><X className="h-3.5 w-3.5" />Reject</button>
          </>
        )}
        {status === 'approved' && (
          <button onClick={() => handleAction(admission._id, 'approve')} className={btnApprove}><Check className="h-3.5 w-3.5" />Re-enroll</button>
        )}
        {status === 'enrolled' && admission.enrolledStudentId && (
          <Link to={`/students/${admission.enrolledStudentId._id || admission.enrolledStudentId}`} className={btnApprove}><Check className="h-3.5 w-3.5" />View Student</Link>
        )}
        {status === 'enrolled' && !admission.enrolledStudentId && (
          <button onClick={() => handleAction(admission._id, 'approve')} className={btnApprove}><Check className="h-3.5 w-3.5" />Re-enroll</button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Manage" title="Admissions" description="Review and process admission applications" actions={<Link to="/admissions/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />New Application</Link>} />

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Application No</th><th>Name</th><th>Class</th><th>Status</th><th className="w-48">Actions</th></tr></thead>
            <tbody>
              {Array.isArray(admissions) && admissions.length > 0 ? admissions.map((admission) => (
                <tr key={admission._id}>
                  <td className="font-mono text-xs font-medium text-slate-900 dark:text-white">{admission.applicationNo}</td>
                  <td className="font-medium text-slate-900 dark:text-white">{admission.studentInfo?.firstName} {admission.studentInfo?.lastName}</td>
                  <td>{admission.classApplied?.name || '-'}</td>
                  <td><StatusBadge value={admission.status} /></td>
                  <td><ActionButtons admission={admission} /></td>
                </tr>
              )) : <tr><td colSpan="5"><EmptyState title="No applications" description="Start accepting admissions." action={<Link to="/admissions/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />New Application</Link>} /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdmissionList
