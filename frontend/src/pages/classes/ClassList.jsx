import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Pencil, Trash2, Users, DoorOpen } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState, EmptyState, ConfirmDialog } from '../../components/ui'

const ClassList = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { fetchClasses() }, [])

  const fetchClasses = async () => {
    try { setError(null); const response = await api.get('/classes'); setClasses(response.data.data || response.data) } catch (err) { setError(err.response?.data?.error || 'Failed to load classes'); console.error('Failed to fetch classes:', err) } finally { setLoading(false) }
  }

  const handleDelete = async (id) => { try { await api.delete(`/classes/${id}`); fetchClasses() } catch (err) { console.error('Failed to delete class:', err) } }

  if (loading) return <LoadingState message="Loading classes..." />
  if (error) return <ErrorState title="Could not load classes" message={error} onRetry={fetchClasses} />

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Academic" title="Classes & Sections" description="Organize classes, sections, and subjects" actions={<Link to="/classes/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />Add Class</Link>} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(classes) && classes.length > 0 ? classes.map((cls) => (
          <div key={cls._id} className="card relative">
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <Link to={`/classes/${cls._id}/edit`} className="icon-button h-8 w-8" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
              <button onClick={() => setDeleteId(cls._id)} className="icon-button h-8 w-8" aria-label="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">{cls.name}</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><Users className="h-4 w-4 text-slate-400" /><div><p className="text-xs text-slate-500">Sections</p><p className="text-sm font-medium text-slate-900 dark:text-white">{cls.sections?.join(', ') || '-'}</p></div></div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><DoorOpen className="h-4 w-4 text-slate-400" /><div><p className="text-xs text-slate-500">Room</p><p className="text-sm font-medium text-slate-900 dark:text-white">{cls.roomNumber || '-'}</p></div></div>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Capacity</span><span className="font-medium text-slate-900 dark:text-white">{cls.capacity || '-'}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Students</span><span className="font-medium text-slate-900 dark:text-white">{cls.currentStrength || 0}</span></div>
            </div>
          </div>
        )) : <div className="col-span-full"><EmptyState title="No classes" description="Create your first class." action={<Link to="/classes/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />Add Class</Link>} /></div>}
      </div>
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Class"
        message="Are you sure you want to delete this class?"
        onConfirm={() => { handleDelete(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

export default ClassList
