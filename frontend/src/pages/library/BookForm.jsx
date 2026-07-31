import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton } from '../../components/ui'

const BookForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!!id)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: '', isbn: '', barcode: '', author: '', publisher: '', category: '', language: 'English',
    edition: '', publicationYear: '', quantity: 1, rackNo: '', shelfNo: '', price: '', description: ''
  })

  useEffect(() => {
    fetchCategories()
    if (id) fetchBook()
  }, [id])

  const fetchCategories = async () => {
    try { const res = await api.get('/library/categories'); setCategories(res.data.data) } catch (error) { /* silently ignore */ }
  }

  const fetchBook = async () => {
    try {
      const res = await api.get(`/library/${id}`)
      setFormData({ ...formData, ...res.data.data })
    } catch (error) { toast.error('Failed to load book') } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (id) {
        await api.put(`/library/${id}`, formData)
        toast.success('Book updated')
      } else {
        await api.post('/library', formData)
        toast.success('Book created')
      }
      navigate('/library')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save book')
    }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Library" title={id ? 'Edit Book' : 'Add Book'} />
      <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Title *</label>
          <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="field" required />
        </div>
        <div>
          <label className="label">Author *</label>
          <input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="field" required />
        </div>
        <div>
          <label className="label">ISBN</label>
          <input value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} className="field" />
        </div>
        <div>
          <label className="label">Barcode</label>
          <input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} className="field" />
        </div>
        <div>
          <label className="label">Publisher</label>
          <input value={formData.publisher} onChange={e => setFormData({ ...formData, publisher: e.target.value })} className="field" />
        </div>
        <div>
          <label className="label">Category</label>
          <input list="categories" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="field" />
          <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="label">Language</label>
          <input value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} className="field" />
        </div>
        <div>
          <label className="label">Edition</label>
          <input value={formData.edition} onChange={e => setFormData({ ...formData, edition: e.target.value })} className="field" />
        </div>
        <div>
          <label className="label">Publication Year</label>
          <input type="number" value={formData.publicationYear} onChange={e => setFormData({ ...formData, publicationYear: e.target.value })} className="field" />
        </div>
        <div>
          <label className="label">Quantity *</label>
          <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} className="field" required />
        </div>
        <div>
          <label className="label">Rack No</label>
          <input value={formData.rackNo} onChange={e => setFormData({ ...formData, rackNo: e.target.value })} className="field" />
        </div>
        <div>
          <label className="label">Shelf No</label>
          <input value={formData.shelfNo} onChange={e => setFormData({ ...formData, shelfNo: e.target.value })} className="field" />
        </div>
        <div>
          <label className="label">Price</label>
          <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="field" rows="3" />
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={() => navigate('/library')} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">{id ? 'Update Book' : 'Create Book'}</button>
        </div>
      </form>
    </div>
  )
}

export default BookForm
