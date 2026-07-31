import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Plus, Building2, BedDouble, Users, Eye, Pencil, Trash2, X, LogOut } from 'lucide-react'

const HostelDashboard = () => {
  const [activeTab, setActiveTab] = useState('hostels')
  const [hostels, setHostels] = useState([])
  const [rooms, setRooms] = useState([])
  const [allocations, setAllocations] = useState([])
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('hostel')
  const [formData, setFormData] = useState({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchHostels(), fetchRooms(), fetchAllocations(), fetchVisitors()])
    setLoading(false)
  }

  const fetchHostels = async () => { try { const res = await api.get('/hostel'); setHostels(res.data.data) } catch (e) { /* ignore */ } }
  const fetchRooms = async () => { try { const res = await api.get('/hostel/rooms'); setRooms(res.data.data) } catch (e) { /* ignore */ } }
  const fetchAllocations = async () => { try { const res = await api.get('/hostel/allocations'); setAllocations(res.data.data) } catch (e) { /* ignore */ } }
  const fetchVisitors = async () => { try { const res = await api.get('/hostel/visitors'); setVisitors(res.data.data) } catch (e) { /* ignore */ } }

  const openModal = (type, data = {}) => { setModalType(type); setFormData(data); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setFormData({}) }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const endpoints = { hostel: '/hostel', room: '/hostel/rooms', allocation: '/hostel/allocations', visitor: '/hostel/visitors' }
      const endpoint = endpoints[modalType]
      const payload = { ...formData, tenantId: localStorage.getItem('tenantId'), schoolId: localStorage.getItem('schoolId') }
      if (formData._id) {
        await api.put(`${endpoint}/${formData._id}`, payload)
      } else {
        await api.post(endpoint, payload)
      }
      toast.success('Saved')
      closeModal()
      fetchAll()
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to save') }
  }

  const handleDelete = async (type, id, endpointOverride) => {
    if (!confirm('Deactivate this record?')) return
    try {
      const endpoints = { hostel: '/hostel', room: '/hostel/rooms', allocation: '/hostel/allocations', visitor: '/hostel/visitors' }
      await api.delete(`${endpointOverride || endpoints[type]}/${id}`)
      toast.success('Deactivated')
      fetchAll()
    } catch (error) { toast.error('Failed to deactivate') }
  }

  const handleVisitorOut = async (id) => {
    try { await api.put(`/hostel/visitors/${id}/out`); toast.success('Marked out'); fetchAll() } catch (error) { toast.error('Failed') }
  }

  if (loading) return (<div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>)

  const tabs = [
    { id: 'hostels', label: 'Hostels', count: hostels.length, icon: Building2 },
    { id: 'rooms', label: 'Rooms', count: rooms.length, icon: BedDouble },
    { id: 'allocations', label: 'Allocations', count: allocations.length, icon: Users },
    { id: 'visitors', label: 'Visitors', count: visitors.length, icon: Eye },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Hostel Management"
        description="Manage hostels, rooms, bed allocations, and visitors"
        actions={
          <Can permission="HOSTEL_MANAGE">
            <button onClick={() => openModal(activeTab.slice(0, -1))} className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> Add {activeTab === 'allocations' ? 'Allocation' : activeTab === 'visitors' ? 'Visitor' : activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}</button>
          </Can>
        }
      />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'hostels' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hostels.length === 0 ? <EmptyState title="No hostels" description="Add a hostel to get started" /> : hostels.map(h => (
              <div key={h._id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{h.name}</p>
                  <Can permission="HOSTEL_MANAGE">
                    <div className="flex gap-1"><button onClick={() => openModal('hostel', h)} className="icon-button h-7 w-7"><Pencil className="h-3 w-3" /></button><button onClick={() => handleDelete('hostel', h._id)} className="icon-button h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3 w-3" /></button></div>
                  </Can>
                </div>
                <p className="mt-1 text-xs capitalize text-slate-400">{h.type} Hostel • {h.totalRooms} rooms • {h.totalBeds} beds</p>
                <p className="mt-1 text-xs text-slate-400">Warden: {h.warden?.name || 'Not assigned'}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="overflow-x-auto">
            {rooms.length === 0 ? <EmptyState title="No rooms" description="Add rooms to hostels" /> : (
              <table className="data-table">
                <thead><tr><th>Hostel</th><th>Room No</th><th>Type</th><th>Capacity</th><th>Occupied</th><th>Actions</th></tr></thead>
                <tbody>
                  {rooms.map(r => (
                    <tr key={r._id}>
                      <td>{r.hostelId?.name}</td>
                      <td className="font-medium">{r.roomNo}</td>
                      <td className="capitalize">{r.roomType}</td>
                      <td>{r.capacity}</td>
                      <td>{r.occupied}</td>
                      <td>
                        <Can permission="HOSTEL_MANAGE">
                          <button onClick={() => openModal('room', r)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete('room', r._id, '/hostel/rooms')} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'allocations' && (
          <div className="overflow-x-auto">
            {allocations.length === 0 ? <EmptyState title="No allocations" description="Assign students to rooms" /> : (
              <table className="data-table">
                <thead><tr><th>Student</th><th>Hostel</th><th>Room</th><th>Bed</th><th>Fees</th><th>Actions</th></tr></thead>
                <tbody>
                  {allocations.map(a => (
                    <tr key={a._id}>
                      <td className="font-medium">{a.studentId?.name}</td>
                      <td>{a.hostelId?.name}</td>
                      <td>{a.roomId?.roomNo}</td>
                      <td>{a.bedNo}</td>
                      <td>₹{a.fees}</td>
                      <td>
                        <Can permission="HOSTEL_MANAGE">
                          <button onClick={() => openModal('allocation', a)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete('allocation', a._id, '/hostel/allocations')} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'visitors' && (
          <div className="overflow-x-auto">
            {visitors.length === 0 ? <EmptyState title="No visitors" description="Record visitor entries" /> : (
              <table className="data-table">
                <thead><tr><th>Visitor</th><th>Student</th><th>Relation</th><th>In</th><th>Out</th><th>Actions</th></tr></thead>
                <tbody>
                  {visitors.map(v => (
                    <tr key={v._id}>
                      <td className="font-medium">{v.visitorName}</td>
                      <td>{v.studentId?.name}</td>
                      <td>{v.relation}</td>
                      <td className="text-xs">{new Date(v.inTime).toLocaleString()}</td>
                      <td className="text-xs">{v.outTime ? new Date(v.outTime).toLocaleString() : '—'}</td>
                      <td>
                        {!v.outTime && (
                          <Can permission="HOSTEL_MANAGE">
                            <button onClick={() => handleVisitorOut(v._id)} className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs"><LogOut className="h-3 w-3" /> Out</button>
                          </Can>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{formData._id ? 'Edit' : 'Add'} {modalType === 'allocation' ? 'Allocation' : modalType === 'hostel' ? 'Hostel' : modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2>
              <button onClick={closeModal} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {modalType === 'hostel' && (
                <>
                  <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" placeholder="Hostel Name" required />
                  <select value={formData.type || 'boys'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="field"><option value="boys">Boys</option><option value="girls">Girls</option><option value="staff">Staff</option><option value="mixed">Mixed</option></select>
                  <textarea value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="field" rows="2" placeholder="Address" />
                </>
              )}
              {modalType === 'room' && (
                <>
                  <select value={formData.hostelId || ''} onChange={e => setFormData({ ...formData, hostelId: e.target.value })} className="field" required><option value="">Select Hostel</option>{hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}</select>
                  <input value={formData.roomNo || ''} onChange={e => setFormData({ ...formData, roomNo: e.target.value })} className="field" placeholder="Room No" required />
                  <select value={formData.roomType || 'double'} onChange={e => setFormData({ ...formData, roomType: e.target.value })} className="field"><option value="single">Single</option><option value="double">Double</option><option value="triple">Triple</option><option value="dormitory">Dormitory</option></select>
                  <input type="number" value={formData.capacity || ''} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} className="field" placeholder="Capacity" />
                </>
              )}
              {modalType === 'allocation' && (
                <>
                  <select value={formData.hostelId || ''} onChange={e => setFormData({ ...formData, hostelId: e.target.value })} className="field" required><option value="">Select Hostel</option>{hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}</select>
                  <select value={formData.roomId || ''} onChange={e => setFormData({ ...formData, roomId: e.target.value })} className="field" required><option value="">Select Room</option>{rooms.filter(r => r.hostelId?._id === formData.hostelId && r.occupied < r.capacity).map(r => <option key={r._id} value={r._id}>{r.roomNo}</option>)}</select>
                  <input value={formData.bedNo || ''} onChange={e => setFormData({ ...formData, bedNo: e.target.value })} className="field" placeholder="Bed No" />
                  <input type="number" value={formData.fees || ''} onChange={e => setFormData({ ...formData, fees: Number(e.target.value) })} className="field" placeholder="Hostel Fees" />
                </>
              )}
              {modalType === 'visitor' && (
                <>
                  <select value={formData.hostelId || ''} onChange={e => setFormData({ ...formData, hostelId: e.target.value })} className="field" required><option value="">Select Hostel</option>{hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}</select>
                  <input value={formData.visitorName || ''} onChange={e => setFormData({ ...formData, visitorName: e.target.value })} className="field" placeholder="Visitor Name" required />
                  <input value={formData.relation || ''} onChange={e => setFormData({ ...formData, relation: e.target.value })} className="field" placeholder="Relation" />
                  <input value={formData.purpose || ''} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className="field" placeholder="Purpose" />
                </>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HostelDashboard
