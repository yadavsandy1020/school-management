import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Plus, Search, BookOpen, Pencil, Trash2, BookCopy } from 'lucide-react'

const LibraryList = () => {
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => { fetchBooks(); fetchCategories() }, [])

  const fetchBooks = async () => {
    try {
      const tenantId = localStorage.getItem('tenantId')
      const schoolId = localStorage.getItem('schoolId')
      const res = await api.get('/library', { params: { tenantId, schoolId, search, category } })
      setBooks(res.data.data)
    } catch (error) {
      toast.error('Failed to load books')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/library/categories')
      setCategories(res.data.data)
    } catch (error) { console.error('Failed to load categories') }
  }

  useEffect(() => {
    fetchBooks()
  }, [search, category])

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this book?')) return
    try {
      await api.delete(`/library/${id}`)
      toast.success('Book deactivated')
      fetchBooks()
    } catch (error) { toast.error('Failed to deactivate book') }
  }

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
        title="Books & Catalog"
        description="Manage library books, issue, and returns"
        actions={
          <Can permission="LIBRARY_MANAGE">
            <Link to="/library/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> Add Book</Link>
          </Can>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center dark:border-slate-800">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, author, ISBN..." className="field h-10 pl-9" />
          </label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="field h-10 sm:w-48">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Can permission="LIBRARY_VIEW"><Link to="/library/issues" className="btn btn-secondary h-10 gap-2"><BookCopy className="h-4 w-4" /> Issues</Link></Can>
        </div>

        {books.length === 0 ? (
          <div className="p-6"><EmptyState title="No books found" description="Add books to the library catalog" action={<Can permission="LIBRARY_MANAGE"><Link to="/library/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> Add Book</Link></Can>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Available</th>
                  <th>Rack</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"><BookOpen className="h-4 w-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{book.title}</p>
                          <p className="text-xs text-slate-400">{book.author} • {book.isbn || 'No ISBN'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs capitalize">{book.category || '—'}</td>
                    <td>{book.quantity}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${book.available > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                        {book.available}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{book.rackNo || '—'} / {book.shelfNo || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Can permission="LIBRARY_MANAGE">
                          <Link to={`/library/${book._id}/edit`} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Link>
                          <button onClick={() => handleDelete(book._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default LibraryList
