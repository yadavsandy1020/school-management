import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ module: '', action: '', search: '' })

  useEffect(() => {
    fetchLogs()
  }, [page, filters.module, filters.action])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 50 }
      if (filters.module) params.module = filters.module
      if (filters.action) params.action = filters.action
      const res = await api.get('/audit-logs', { params })
      setLogs(res.data.data)
      setTotalPages(res.data.pages)
      setTotal(res.data.total)
    } catch (error) {
      console.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const actionColors = {
    CREATE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
    UPDATE: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
    DELETE: 'text-red-600 bg-red-50 dark:bg-red-500/10',
    LOGIN: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
    LOGOUT: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
    EXPORT: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10',
    APPROVE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
    REJECT: 'text-red-600 bg-red-50 dark:bg-red-500/10'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Audit Logs"
        description={`${total} recorded actions across all modules`}
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center dark:border-slate-800">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search logs..."
              className="field h-10 pl-9"
            />
          </label>
          <select value={filters.module} onChange={e => { setFilters({ ...filters, module: e.target.value }); setPage(1) }} className="field h-10 sm:w-48">
            <option value="">All Modules</option>
            <option value="auth">Auth</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
            <option value="fees">Fees</option>
            <option value="finance">Finance</option>
            <option value="attendance">Attendance</option>
            <option value="settings">Settings</option>
            <option value="rbac">RBAC</option>
          </select>
          <select value={filters.action} onChange={e => { setFilters({ ...filters, action: e.target.value }); setPage(1) }} className="field h-10 sm:w-40">
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="EXPORT">Export</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6"><EmptyState title="No audit logs" description="No activity recorded with current filters" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>User</th>
                  <th>IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${actionColors[log.action] || 'text-slate-600 bg-slate-100 dark:bg-slate-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="capitalize">{log.module}</td>
                    <td className="max-w-xs truncate">{log.description}</td>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{log.userEmail || 'System'}</p>
                        <p className="text-xs text-slate-400 capitalize">{log.userRole?.replace('_', ' ')}</p>
                      </div>
                    </td>
                    <td className="text-xs text-slate-400">{log.ip || '—'}</td>
                    <td className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800">
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary h-9 w-9 p-0 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary h-9 w-9 p-0 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogs
