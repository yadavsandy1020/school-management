import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Pin, Pencil } from 'lucide-react'
import { PageHeader, Skeleton, EmptyState, StatusBadge } from '../../components/ui'

const NoticeList = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchNotices() }, [])

  const fetchNotices = async () => {
    try { const response = await api.get('/notices'); setNotices(response.data.data || response.data) } catch (error) { console.error('Failed to fetch notices:', error) } finally { setLoading(false) }
  }

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Communication" title="Notifications" description="Manage school notices and announcements" actions={<Link to="/notices/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />New Notice</Link>} />

      <div className="space-y-4">
        {Array.isArray(notices) && notices.length > 0 ? notices.map((notice) => (
          <div key={notice._id} className="card relative">
            <div className="absolute right-4 top-4">
              <Link to={`/notices/${notice._id}/edit`} className="icon-button h-8 w-8" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
            </div>
            <div className="flex items-start gap-3">
              {notice.isPinned && <Pin className="mt-0.5 h-4 w-4 text-indigo-500" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><h3 className="text-base font-semibold text-slate-900 dark:text-white">{notice.title}</h3>{notice.priority && <StatusBadge value={notice.priority} />}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{notice.content}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400"><span>Published: {new Date(notice.publishDate || notice.createdAt).toLocaleDateString()}</span>{notice.category && <span>Category: {notice.category}</span>}</div>
              </div>
            </div>
          </div>
        )) : <EmptyState title="No notices" description="Publish your first announcement." action={<Link to="/notices/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />New Notice</Link>} />}
      </div>
    </div>
  )
}

export default NoticeList
