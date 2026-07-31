import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Calendar, Trash2, Edit } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const HomeworkList = () => {
  const { user } = useAuth()
  const [homework, setHomework] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ classId: '', subject: '' })

  useEffect(() => { fetchHomework() }, [filters.classId, filters.subject])

  const fetchHomework = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.classId) params.append('classId', filters.classId)
      if (filters.subject) params.append('subject', filters.subject)
      const { data } = await api.get(`/homework?${params.toString()}`)
      if (data.success) setHomework(data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch homework')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this homework?')) return
    try {
      await api.delete(`/homework/${id}`)
      toast.success('Homework deleted')
      fetchHomework()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed')
    }
  }

  const isParent = user?.role === 'parent'
  const canManage = ['super_admin', 'school_admin', 'teacher'].includes(user?.role)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Homework</h1>
          <p className="mt-1 text-sm text-slate-500">{isParent ? 'View your homework assignments' : 'Manage homework assignments'}</p>
        </div>
        {canManage && (
          <Link to="/homework/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Assign Homework
          </Link>
        )}
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Filter by subject..."
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          className="field max-w-xs"
        />
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-500">Loading...</div>
      ) : homework.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">No homework assignments found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homework.map((hw) => (
            <div key={hw._id} className="card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">{hw.subject}</span>
                  <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">{hw.title}</h3>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Link to={`/homework/${hw._id}/edit`} className="icon-button h-8 w-8"><Edit className="h-4 w-4" /></Link>
                    <button onClick={() => handleDelete(hw._id)} className="icon-button h-8 w-8 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{hw.description}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                {hw.classId && <span>{hw.classId.name}</span>}
                <span>{hw.section}</span>
              </div>
              {hw.assignedBy && <p className="mt-2 text-xs text-slate-400">By: {hw.assignedBy.name}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HomeworkList
