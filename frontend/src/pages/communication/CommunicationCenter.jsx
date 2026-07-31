import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Send, Mail, MessageSquare, ScrollText } from 'lucide-react'

const CommunicationCenter = () => {
  const [activeTab, setActiveTab] = useState('compose')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    audience: ['all'],
    subject: '',
    body: '',
    sendEmail: false,
    sendSMS: false
  })
  const [testEmail, setTestEmail] = useState({ to: '', subject: '', body: '' })
  const [testSMS, setTestSMS] = useState({ to: '', message: '' })

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try { const res = await api.get('/communication/logs'); setLogs(res.data.data) } catch (error) { toast.error('Failed to load logs') } finally { setLoading(false) }
  }

  const handleBulkSend = async (e) => {
    e.preventDefault()
    try {
      await api.post('/communication/bulk', formData)
      toast.success('Bulk communication sent')
      setFormData({ audience: ['all'], subject: '', body: '', sendEmail: false, sendSMS: false })
      fetchLogs()
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to send') }
  }

  const handleEmailSend = async (e) => {
    e.preventDefault()
    try {
      await api.post('/communication/email', testEmail)
      toast.success('Test email sent')
      setTestEmail({ to: '', subject: '', body: '' })
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to send email') }
  }

  const handleSMSSend = async (e) => {
    e.preventDefault()
    try {
      await api.post('/communication/sms', testSMS)
      toast.success('Test SMS sent')
      setTestSMS({ to: '', message: '' })
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to send SMS') }
  }

  const audienceOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'super_admin', label: 'Super Admins' },
    { value: 'school_admin', label: 'School Admins' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'student', label: 'Students' },
    { value: 'parent', label: 'Parents' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Communication" title="Communication Center" description="Send emails, SMS, and announcements to staff, students, and parents" />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {[
          { id: 'compose', label: 'Compose', icon: Send },
          { id: 'email', label: 'Test Email', icon: Mail },
          { id: 'sms', label: 'Test SMS', icon: MessageSquare },
          { id: 'logs', label: 'Logs', icon: ScrollText },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'compose' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Bulk Announcement</h3>
          <form onSubmit={handleBulkSend} className="space-y-4">
            <div>
              <label className="label mb-1">Audience</label>
              <div className="flex flex-wrap gap-3">
                {audienceOptions.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.audience.includes(opt.value)}
                      onChange={e => setFormData(prev => ({ ...prev, audience: e.target.checked ? [...prev.audience, opt.value] : prev.audience.filter(a => a !== opt.value) }))}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="field" placeholder="Subject" required />
            <textarea value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} className="field min-h-[120px]" placeholder="Message body" required />
            <div className="flex gap-4">
              <Can permission="EMAIL_SEND"><label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={formData.sendEmail} onChange={e => setFormData({ ...formData, sendEmail: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600" /> Send as Email</label></Can>
              <Can permission="SMS_SEND"><label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={formData.sendSMS} onChange={e => setFormData({ ...formData, sendSMS: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600" /> Send as SMS</label></Can>
            </div>
            <Can permission="NOTICE_CREATE">
              <button type="submit" disabled={!formData.sendEmail && !formData.sendSMS} className="btn btn-primary gap-2"><Send className="h-4 w-4" /> Send Announcement</button>
            </Can>
          </form>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Test Email</h3>
          <form onSubmit={handleEmailSend} className="space-y-4">
            <input value={testEmail.to} onChange={e => setTestEmail({ ...testEmail, to: e.target.value })} className="field" placeholder="Recipient Email" required />
            <input value={testEmail.subject} onChange={e => setTestEmail({ ...testEmail, subject: e.target.value })} className="field" placeholder="Subject" required />
            <textarea value={testEmail.body} onChange={e => setTestEmail({ ...testEmail, body: e.target.value })} className="field min-h-[120px]" placeholder="Body" required />
            <Can permission="EMAIL_SEND"><button type="submit" className="btn btn-primary gap-2"><Mail className="h-4 w-4" /> Send Test Email</button></Can>
          </form>
        </div>
      )}

      {activeTab === 'sms' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Test SMS</h3>
          <form onSubmit={handleSMSSend} className="space-y-4">
            <input value={testSMS.to} onChange={e => setTestSMS({ ...testSMS, to: e.target.value })} className="field" placeholder="Phone Number" required />
            <textarea value={testSMS.message} onChange={e => setTestSMS({ ...testSMS, message: e.target.value })} className="field min-h-[120px]" placeholder="Message" required />
            <Can permission="SMS_SEND"><button type="submit" className="btn btn-primary gap-2"><MessageSquare className="h-4 w-4" /> Send Test SMS</button></Can>
          </form>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          {loading ? <Skeleton className="h-64" /> : logs.length === 0 ? <EmptyState title="No communication logs" description="Send messages to see logs here" /> : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Subject</th><th>Sender</th><th>Audience</th><th>Date</th></tr></thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td className="font-medium">{log.subject}</td>
                      <td>{log.senderId?.name}</td>
                      <td>{log.recipientRoles?.join(', ')}</td>
                      <td className="text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CommunicationCenter
