import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, Plus, Pencil, Trash2, X, Star } from 'lucide-react'

const AcademicSessions = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    name: '', code: '', startDate: '', endDate: '', isCurrent: false
  })

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    try {
      const tenantId = user?.tenantId || localStorage.getItem('tenantId')
      const schoolId = user?.schoolId || localStorage.getItem('schoolId')
      const res = await api.get('/academic-sessions', { params: { tenantId, schoolId } })
      setSessions(res.data.data)
    } catch (error) {
      toast.error('Failed to load academic sessions')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormData({ name: '', code: '', startDate: '', endDate: '', isCurrent: false })
    setShowModal(true)
  }

  const openEdit = (session) => {
    setEditing(session)
    setFormData({
      name: session.name,
      code: session.code,
      startDate: session.startDate?.split('T')[0] || '',
      endDate: session.endDate?.split('T')[0] || '',
      isCurrent: session.isCurrent
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const tenantId = user?.tenantId || localStorage.getItem('tenantId')
      const schoolId = user?.schoolId || localStorage.getItem('schoolId')
      const payload = { ...formData, tenantId, schoolId }
      if (editing) {
        await api.put(`/academic-sessions/${editing._id}`, payload)
        toast.success('Session updated')
      } else {
        await api.post('/academic-sessions', payload)
        toast.success('Session created')
      }
      setShowModal(false)
      fetchSessions()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save session')
    }
  }

  const handleSetCurrent = async (id) => {
    try {
      await api.post(`/academic-sessions/${id}/set-current`)
      toast.success('Current session updated')
      fetchSessions()
    } catch (error) {
      toast.error('Failed to set current session')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this academic session?')) return
    try {
      await api.delete(`/academic-sessions/${id}`)
      toast.success('Session deactivated')
      fetchSessions()
    } catch (error) {
      toast.error('Failed to deactivate session')
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic"
        title="Academic Sessions"
        description="Manage academic years and financial periods"
        actions={
          <Can permission="SETTINGS_MANAGE">
            <button onClick={openCreate} className="btn btn-primary gap-2">
              <Plus className="h-4 w-4" /> New Session
            </button>
          </Can>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState title="No sessions found" description="Create your first academic session to get started" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map(session => (
            <div key={session._id} className="card relative">
              {session.isCurrent && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Star className="h-3 w-3" /> Current
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{session.name}</p>
                  <p className="text-xs text-slate-400">{session.code}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Start:</span> {new Date(session.startDate).toLocaleDateString()}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-200">End:</span> {new Date(session.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Can permission="SETTINGS_MANAGE">
                  {!session.isCurrent && (
                    <button onClick={() => handleSetCurrent(session._id)} className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs">
                      <Star className="h-3 w-3" /> Set Current
                    </button>
                  )}
                  <button onClick={() => openEdit(session)} className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(session._id)} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{editing ? 'Edit Session' : 'New Academic Session'}</h2>
              <button onClick={() => setShowModal(false)} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Session Name</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" placeholder="e.g. 2024-25" required />
                </div>
                <div>
                  <label className="label">Code</label>
                  <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="field" placeholder="e.g. 2024-2025" required />
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="field" required />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="field" required />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isCurrent} onChange={e => setFormData({ ...formData, isCurrent: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Set as current session</span>
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AcademicSessions
