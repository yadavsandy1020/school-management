import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton } from '../../components/ui'
import Can from '../../components/Can'
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'

const Calendar = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState({ title: '', type: 'event', startDate: '', endDate: '', allDay: false, description: '', location: '', audience: ['all'] })

  useEffect(() => { fetchEvents() }, [currentDate])

  const fetchEvents = async () => {
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
      const res = await api.get('/calendar/events', { params: { start, end } })
      setEvents(res.data.data)
    } catch (error) { toast.error('Failed to load events') } finally { setLoading(false) }
  }

  const typeColors = {
    holiday: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    event: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
    exam: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    meeting: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    activity: 'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300',
    reminder: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (selectedEvent) {
        await api.put(`/calendar/events/${selectedEvent._id}`, formData)
        toast.success('Event updated')
      } else {
        await api.post('/calendar/events', formData)
        toast.success('Event created')
      }
      setShowModal(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to save event') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    try { await api.delete(`/calendar/events/${id}`); toast.success('Event deleted'); fetchEvents() } catch (error) { toast.error('Failed to delete') }
  }

  const openCreate = (dateStr) => {
    setSelectedEvent(null)
    setFormData({ title: '', type: 'event', startDate: dateStr || new Date().toISOString().split('T')[0], endDate: dateStr || new Date().toISOString().split('T')[0], allDay: true, description: '', location: '', audience: ['all'] })
    setShowModal(true)
  }

  const openEdit = (event) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      type: event.type,
      startDate: event.startDate?.split('T')[0],
      endDate: event.endDate?.split('T')[0],
      allDay: event.allDay,
      description: event.description || '',
      location: event.location || '',
      audience: event.audience || ['all']
    })
    setShowModal(true)
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const getEventsForDate = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
    return events.filter(e => {
      const start = new Date(e.startDate).toDateString()
      const end = new Date(e.endDate).toDateString()
      return dateStr >= start && dateStr <= end
    })
  }

  if (loading) return (<div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="School Calendar"
        description="Events, holidays, exams, and reminders in one place"
        actions={
          <Can permission="NOTICE_CREATE">
            <button onClick={() => openCreate()} className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> New Event</button>
          </Can>
        }
      />

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{monthName}</h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="icon-button h-9 w-9"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary h-9 px-3 text-xs">Today</button>
            <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="icon-button h-9 w-9"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="min-h-[100px] bg-white dark:bg-slate-900" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateEvents = getEventsForDate(day)
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
            return (
              <div key={day} onClick={() => openCreate(dateStr)} className="group relative min-h-[100px] cursor-pointer bg-white p-2 transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`}>{day}</div>
                <div className="mt-1 space-y-1">
                  {dateEvents.slice(0, 2).map(e => (
                    <button key={e._id} onClick={(ev) => { ev.stopPropagation(); openEdit(e) }} className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium ${typeColors[e.type] || typeColors.event}`}>
                      {e.title}
                    </button>
                  ))}
                  {dateEvents.length > 2 && <p className="text-[10px] text-slate-400 pl-1">+{dateEvents.length - 2} more</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedEvent ? 'Edit Event' : 'New Event'}</h2>
              <button onClick={() => setShowModal(false)} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="field" placeholder="Event title" required />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="field"><option value="holiday">Holiday</option><option value="event">Event</option><option value="exam">Exam</option><option value="meeting">Meeting</option><option value="activity">Activity</option><option value="reminder">Reminder</option></select>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={formData.allDay} onChange={e => setFormData({ ...formData, allDay: e.target.checked })} className="h-4 w-4 rounded border-slate-300" /> All day</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="field" required />
                <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="field" required />
              </div>
              <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="field" placeholder="Location" />
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="field" rows="3" placeholder="Description" />
              <div className="flex justify-end gap-2">
                {selectedEvent && <Can permission="NOTICE_CREATE"><button type="button" onClick={() => handleDelete(selectedEvent._id)} className="btn btn-danger">Delete</button></Can>}
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{selectedEvent ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
