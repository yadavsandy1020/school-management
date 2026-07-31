import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Search, BookOpen, RotateCcw, Plus, X } from 'lucide-react'

const LibraryIssues = () => {
  const [issues, setIssues] = useState([])
  const [books, setBooks] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [search, setSearch] = useState('')
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', dueDate: '', notes: '' })

  useEffect(() => { fetchIssues(); fetchBooks(); fetchStudents() }, [])

  const fetchIssues = async () => {
    try {
      const res = await api.get('/library/issues/all')
      setIssues(res.data.data)
    } catch (error) { toast.error('Failed to load issues') } finally { setLoading(false) }
  }

  const fetchBooks = async () => {
    try { const res = await api.get('/library'); setBooks(res.data.data) } catch (error) { /* silently ignore */ }
  }

  const fetchStudents = async () => {
    try { const res = await api.get('/users/students'); setStudents(res.data.students) } catch (error) { /* silently ignore */ }
  }

  const handleReturn = async (id) => {
    try {
      await api.put(`/library/issues/${id}/return`, { fineAmount: 0 })
      toast.success('Book returned')
      fetchIssues()
    } catch (error) { toast.error('Failed to return book') }
  }

  const handleIssue = async (e) => {
    e.preventDefault()
    try {
      await api.post('/library/issues', issueForm)
      toast.success('Book issued')
      setShowIssueModal(false)
      setIssueForm({ bookId: '', studentId: '', dueDate: '', notes: '' })
      fetchIssues()
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to issue book') }
  }

  const filteredIssues = issues.filter(i =>
    i.bookId?.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.studentId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <div className="card"><Skeleton className="h-64" /></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Book Issues & Returns"
        description="Track issued, returned, and overdue books"
        actions={
          <Can permission="LIBRARY_MANAGE">
            <button onClick={() => setShowIssueModal(true)} className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> Issue Book</button>
          </Can>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center dark:border-slate-800">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="field h-10 pl-9" />
          </label>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="p-6"><EmptyState title="No issue records" description="Issue books to see them here" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Issued To</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(issue => {
                  const isOverdue = issue.status === 'issued' && new Date(issue.dueDate) < new Date()
                  return (
                    <tr key={issue._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 text-indigo-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{issue.bookId?.title}</p>
                            <p className="text-xs text-slate-400">{issue.bookId?.barcode}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{issue.studentId?.name || issue.staffId?.name}</p>
                        <p className="text-xs text-slate-400">{issue.studentId?.studentDetails?.admissionNo}</p>
                      </td>
                      <td className="text-xs text-slate-400">{new Date(issue.issueDate).toLocaleDateString()}</td>
                      <td className={`text-xs ${isOverdue ? 'font-semibold text-red-600' : 'text-slate-400'}`}>{new Date(issue.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${issue.status === 'returned' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : isOverdue ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                          {issue.status} {isOverdue && '(Overdue)'}
                        </span>
                      </td>
                      <td>
                        {issue.status === 'issued' && (
                          <Can permission="LIBRARY_MANAGE">
                            <button onClick={() => handleReturn(issue._id)} className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs">
                              <RotateCcw className="h-3 w-3" /> Return
                            </button>
                          </Can>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Issue Book</h2>
              <button onClick={() => setShowIssueModal(false)} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleIssue} className="mt-4 space-y-4">
              <div>
                <label className="label">Book *</label>
                <select value={issueForm.bookId} onChange={e => setIssueForm({ ...issueForm, bookId: e.target.value })} className="field" required>
                  <option value="">Select Book</option>
                  {books.filter(b => b.available > 0).map(b => <option key={b._id} value={b._id}>{b.title} ({b.available} available)</option>)}
                </select>
              </div>
              <div>
                <label className="label">Student *</label>
                <select value={issueForm.studentId} onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })} className="field" required>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} - {s.studentDetails?.admissionNo}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Due Date *</label>
                <input type="date" value={issueForm.dueDate} onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })} className="field" required />
              </div>
              <div>
                <label className="label">Notes</label>
                <input value={issueForm.notes} onChange={e => setIssueForm({ ...issueForm, notes: e.target.value })} className="field" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowIssueModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Issue Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LibraryIssues
