import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Plus, Bus, User, MapPin, Users, Pencil, Trash2, X } from 'lucide-react'

const TransportDashboard = () => {
  const [activeTab, setActiveTab] = useState('vehicles')
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [routes, setRoutes] = useState([])
  const [allocations, setAllocations] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('vehicle')
  const [formData, setFormData] = useState({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchVehicles(), fetchDrivers(), fetchRoutes(), fetchAllocations(), fetchStudents()])
    setLoading(false)
  }

  const fetchVehicles = async () => { try { const res = await api.get('/transport/vehicles'); setVehicles(res.data.data) } catch (e) { /* ignore */ } }
  const fetchDrivers = async () => { try { const res = await api.get('/transport/drivers'); setDrivers(res.data.data) } catch (e) { /* ignore */ } }
  const fetchRoutes = async () => { try { const res = await api.get('/transport/routes'); setRoutes(res.data.data) } catch (e) { /* ignore */ } }
  const fetchAllocations = async () => { try { const res = await api.get('/transport/allocations'); setAllocations(res.data.data) } catch (e) { /* ignore */ } }
  const fetchStudents = async () => { try { const res = await api.get('/students?limit=500'); setStudents(res.data.data || res.data.students || []) } catch (e) { /* ignore */ } }

  const openModal = (type, data = {}) => {
    let normalized = { ...data }
    // Normalize populated ObjectId fields to plain IDs
    if (type === 'allocation') {
      if (normalized.studentId && typeof normalized.studentId === 'object') normalized.studentId = normalized.studentId._id
      if (normalized.routeId && typeof normalized.routeId === 'object') normalized.routeId = normalized.routeId._id
    }
    if (type === 'route') {
      if (normalized.vehicleId && typeof normalized.vehicleId === 'object') normalized.vehicleId = normalized.vehicleId._id
      if (normalized.driverId && typeof normalized.driverId === 'object') normalized.driverId = normalized.driverId._id
    }
    if (type === 'driver') {
      if (normalized.assignedVehicle && typeof normalized.assignedVehicle === 'object') normalized.assignedVehicle = normalized.assignedVehicle._id
    }
    setModalType(type); setFormData(normalized); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setFormData({}) }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const endpoint = `/transport/${modalType}s`
      const payload = { ...formData }
      delete payload.tenantId
      delete payload.schoolId
      delete payload._id
      delete payload.__v
      delete payload.createdAt
      delete payload.updatedAt
      delete payload.createdBy
      delete payload.updatedBy

      // Ensure ObjectId fields are plain strings (not populated objects)
      if (modalType === 'allocation') {
        if (payload.studentId && typeof payload.studentId === 'object') payload.studentId = payload.studentId._id
        if (payload.routeId && typeof payload.routeId === 'object') payload.routeId = payload.routeId._id
      }
      if (modalType === 'route') {
        if (payload.vehicleId && typeof payload.vehicleId === 'object') payload.vehicleId = payload.vehicleId._id
        if (payload.driverId && typeof payload.driverId === 'object') payload.driverId = payload.driverId._id
        if (!payload.vehicleId) payload.vehicleId = null
        if (!payload.driverId) payload.driverId = null
      }
      if (modalType === 'driver') {
        if (payload.assignedVehicle && typeof payload.assignedVehicle === 'object') payload.assignedVehicle = payload.assignedVehicle._id
        if (!payload.assignedVehicle) payload.assignedVehicle = null
      }

      if (formData._id) {
        await api.put(`${endpoint}/${formData._id}`, payload)
      } else {
        await api.post(endpoint, payload)
      }
      toast.success('Saved successfully')
      closeModal()
      fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save')
    }
  }

  const handleDelete = async (type, id) => {
    if (!confirm('Deactivate this record?')) return
    try {
      await api.delete(`/transport/${type}s/${id}`)
      toast.success('Deactivated')
      fetchAll()
    } catch (error) { toast.error('Failed to deactivate') }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <div className="card"><Skeleton className="h-64" /></div>
    </div>
  )

  const tabs = [
    { id: 'vehicles', label: 'Vehicles', count: vehicles.length, icon: Bus },
    { id: 'drivers', label: 'Drivers', count: drivers.length, icon: User },
    { id: 'routes', label: 'Routes', count: routes.length, icon: MapPin },
    { id: 'allocations', label: 'Allocations', count: allocations.length, icon: Users },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Transport Management"
        description="Manage vehicles, drivers, routes, and student allocations"
        actions={
          <Can permission="TRANSPORT_MANAGE">
            <button onClick={() => openModal(activeTab.slice(0, -1))} className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> Add {activeTab === 'allocations' ? 'Allocation' : activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}</button>
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
        {activeTab === 'vehicles' && (
          <div className="overflow-x-auto">
            {vehicles.length === 0 ? <EmptyState title="No vehicles" description="Add vehicles to manage transport" /> : (
              <table className="data-table">
                <thead><tr><th>Name</th><th>Registration</th><th>Type</th><th>Capacity</th><th>Actions</th></tr></thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v._id}>
                      <td className="font-medium">{v.name}</td>
                      <td>{v.registrationNo}</td>
                      <td className="capitalize">{v.type}</td>
                      <td>{v.capacity}</td>
                      <td>
                        <Can permission="TRANSPORT_MANAGE">
                          <button onClick={() => openModal('vehicle', v)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete('vehicle', v._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="overflow-x-auto">
            {drivers.length === 0 ? <EmptyState title="No drivers" description="Add drivers to manage transport" /> : (
              <table className="data-table">
                <thead><tr><th>Name</th><th>Phone</th><th>License</th><th>Assigned Vehicle</th><th>Actions</th></tr></thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d._id}>
                      <td className="font-medium">{d.name}</td>
                      <td>{d.phone}</td>
                      <td>{d.licenseNo}</td>
                      <td>{d.assignedVehicle?.name || '—'}</td>
                      <td>
                        <Can permission="TRANSPORT_MANAGE">
                          <button onClick={() => openModal('driver', d)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete('driver', d._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="space-y-3">
            {routes.length === 0 ? <EmptyState title="No routes" description="Add routes and stops" /> : routes.map(r => (
              <div key={r._id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.code} • {r.vehicleId?.name || 'No vehicle'} • {r.stops?.length || 0} stops • ₹{r.fare || 0}</p>
                  </div>
                  <Can permission="TRANSPORT_MANAGE">
                    <div className="flex gap-2">
                      <button onClick={() => openModal('route', r)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete('route', r._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </Can>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'allocations' && (
          <div className="overflow-x-auto">
            {allocations.length === 0 ? <EmptyState title="No allocations" description="Assign students to routes" /> : (
              <table className="data-table">
                <thead><tr><th>Student</th><th>Route</th><th>Vehicle</th><th>Stop</th><th>Monthly Fare</th><th>Actions</th></tr></thead>
                <tbody>
                  {allocations.map(a => (
                    <tr key={a._id}>
                      <td className="font-medium">{a.studentId?.personalInfo?.firstName} {a.studentId?.personalInfo?.lastName}</td>
                      <td>{a.routeId?.name}</td>
                      <td className="text-sm">{a.routeId?.vehicleId?.name || '-'} {a.routeId?.vehicleId?.registrationNo ? `(${a.routeId.vehicleId.registrationNo})` : ''}</td>
                      <td>{a.stopName || '-'}</td>
                      <td>₹{a.fare?.toLocaleString() || 0}</td>
                      <td>
                        <Can permission="TRANSPORT_MANAGE">
                          <button onClick={() => openModal('allocation', a)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete('allocation', a._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Can>
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
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{formData._id ? 'Edit' : 'Add'} {modalType === 'allocation' ? 'Allocation' : modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2>
              <button onClick={closeModal} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {modalType === 'vehicle' && (
                <>
                  <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" placeholder="Vehicle Name" required />
                  <input value={formData.registrationNo || ''} onChange={e => setFormData({ ...formData, registrationNo: e.target.value })} className="field" placeholder="Registration No" required />
                  <select value={formData.type || 'bus'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="field"><option value="bus">Bus</option><option value="van">Van</option><option value="car">Car</option><option value="other">Other</option></select>
                  <input type="number" value={formData.capacity || ''} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} className="field" placeholder="Capacity" />
                  <input value={formData.gpsDeviceId || ''} onChange={e => setFormData({ ...formData, gpsDeviceId: e.target.value })} className="field" placeholder="GPS Device ID" />
                </>
              )}
              {modalType === 'driver' && (
                <>
                  <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" placeholder="Driver Name" required />
                  <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="field" placeholder="Phone" />
                  <input value={formData.licenseNo || ''} onChange={e => setFormData({ ...formData, licenseNo: e.target.value })} className="field" placeholder="License No" required />
                  <select value={formData.assignedVehicle || ''} onChange={e => setFormData({ ...formData, assignedVehicle: e.target.value })} className="field">
                    <option value="">No Vehicle</option>
                    {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </>
              )}
              {modalType === 'route' && (
                <>
                  <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" placeholder="Route Name" required />
                  <input value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} className="field" placeholder="Route Code" required />
                  <select value={formData.vehicleId || ''} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })} className="field"><option value="">Select Vehicle</option>{vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}</select>
                  <select value={formData.driverId || ''} onChange={e => setFormData({ ...formData, driverId: e.target.value })} className="field"><option value="">Select Driver</option>{drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
                  <input type="number" value={formData.fare || ''} onChange={e => setFormData({ ...formData, fare: Number(e.target.value) })} className="field" placeholder="Default Route Fare (₹)" required />
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Stops</span>
                      <button type="button" onClick={() => setFormData({ ...formData, stops: [...(formData.stops || []), { name: '', sequence: (formData.stops?.length || 0) + 1, pickupTime: '', dropTime: '', fare: 0 }] })} className="text-xs font-medium text-indigo-600 hover:text-indigo-700"><Plus className="inline h-3 w-3" /> Add Stop</button>
                    </div>
                    {(formData.stops || []).length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">No stops added. Default route fare will be used for all allocations.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {formData.stops.map((stop, i) => (
                          <div key={i} className="flex gap-2">
                            <input value={stop.name || ''} onChange={e => { const stops = [...formData.stops]; stops[i] = { ...stops[i], name: e.target.value }; setFormData({ ...formData, stops }) }} className="field flex-1" placeholder="Stop name" />
                            <input value={stop.pickupTime || ''} onChange={e => { const stops = [...formData.stops]; stops[i] = { ...stops[i], pickupTime: e.target.value }; setFormData({ ...formData, stops }) }} className="field w-24" placeholder="Pickup" />
                            <input type="number" value={stop.fare || ''} onChange={e => { const stops = [...formData.stops]; stops[i] = { ...stops[i], fare: Number(e.target.value) }; setFormData({ ...formData, stops }) }} className="field w-24" placeholder="Fare" />
                            <button type="button" onClick={() => setFormData({ ...formData, stops: formData.stops.filter((_, idx) => idx !== i) })} className="icon-button h-9 w-9 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><X className="h-4 w-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              {modalType === 'allocation' && (
                <>
                  <select value={formData.studentId || ''} onChange={e => setFormData({ ...formData, studentId: e.target.value })} className="field" required><option value="">Select Student</option>{students.map(s => <option key={s._id} value={s._id}>{s.personalInfo?.firstName} {s.personalInfo?.lastName} ({s.admissionNo})</option>)}</select>
                  <select value={formData.routeId || ''} onChange={e => {
                    const selectedRoute = routes.find(r => r._id === e.target.value)
                    setFormData({ ...formData, routeId: e.target.value, fare: selectedRoute?.fare || 0, stopName: '' })
                  }} className="field" required><option value="">Select Route</option>{routes.map(r => <option key={r._id} value={r._id}>{r.name} (₹{r.fare || 0})</option>)}</select>
                  <select value={formData.stopName || ''} onChange={e => {
                    const selectedRoute = routes.find(r => r._id === formData.routeId)
                    const selectedStop = selectedRoute?.stops?.find(s => s.name === e.target.value)
                    const stopFare = selectedStop?.fare
                    setFormData({ ...formData, stopName: e.target.value, fare: stopFare !== undefined && stopFare > 0 ? stopFare : (selectedRoute?.fare || formData.fare || 0) })
                  }} className="field">
                    <option value="">Select Stop (optional)</option>
                    {routes.find(r => r._id === formData.routeId)?.stops?.map(s => <option key={s.name} value={s.name}>{s.name}{s.fare ? ` (₹${s.fare})` : ''}</option>) || []}
                  </select>
                  <input type="number" value={formData.fare || ''} onChange={e => setFormData({ ...formData, fare: Number(e.target.value) })} className="field" placeholder="Monthly Fare (₹)" required />
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

export default TransportDashboard
