import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Bell, Pin } from 'lucide-react'

const NoticeList = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices')
      setNotices(response.data.data || response.data)
    } catch (error) {
      console.error('Failed to fetch notices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-600 mt-1">School announcements and notices</p>
        </div>
        <Link to="/notices/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Create Notice
        </Link>
      </div>

      <div className="space-y-4">
        {Array.isArray(notices) && notices.length > 0 ? (
          notices.map((notice) => (
            <div key={notice._id} className={`card ${notice.isPinned ? 'border-l-4 border-primary-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {notice.isPinned && <Pin className="w-4 h-4 text-primary-600" />}
                    <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      notice.priority === 'high' ? 'bg-red-100 text-red-700' :
                      notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{notice.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Published: {new Date(notice.publishDate).toLocaleDateString()}</span>
                    <span>Category: {notice.category}</span>
                    <span>Views: {notice.views}</span>
                  </div>
                </div>
                <Link to={`/notices/${notice._id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12 text-gray-500">No notices found</div>
        )}
      </div>
    </div>
  )
}

export default NoticeList
