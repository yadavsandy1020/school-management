import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Plus, Users, Calendar, Wallet, Building2, Pencil, Trash2, X, CheckCircle, XCircle } from 'lucide-react'

const HRMSDashboard = () => {
  const [activeTab, setActiveTab] = useState('employees')
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [leaves, setLeaves] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('employee')
  const [formData, setFormData] = useState({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchEmployees(), fetchDepartments(), fetchLeaves(), fetchPayrolls()])
    setLoading(false)
  }

  const fetchEmployees = async () => { try { const res = await api.get('/hrms/employees'); setEmployees(res.data.data) } catch (e) { /* ignore */ } }
  const fetchDepartments = async () => { try { const res = await api.get('/hrms/departments'); setDepartments(res.data.data) } catch (e) { /* ignore */ } }
  const fetchLeaves = async () => { try { const res = await api.get('/hrms/leaves'); setLeaves(res.data.data) } catch (e) { /* ignore */ } }
  const fetchPayrolls = async () => { try { const res = await api.get('/hrms/payrolls'); setPayrolls(res.data.data) } catch (e) { /* ignore */ } }

  const openModal = (type, data = {}) => { setModalType(type); setFormData(data); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setFormData({}) }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const endpoints = { employee: '/hrms/employees', department: '/hrms/departments', leave: '/hrms/leaves', payroll: '/hrms/payrolls' }
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

  const handleDelete = async (type, id) => {
    if (!confirm('Deactivate this record?')) return
    const endpoints = { employee: '/hrms/employees', department: '/hrms/departments', leave: '/hrms/leaves', payroll: '/hrms/payrolls' }
    try { await api.delete(`${endpoints[type]}/${id}`); toast.success('Deactivated'); fetchAll() } catch (error) { toast.error('Failed to deactivate') }
  }

  const handleLeaveStatus = async (id, status) => {
    try { await api.put(`/hrms/leaves/${id}/status`, { status }); toast.success(`Leave ${status}`); fetchAll() } catch (error) { toast.error('Failed') }
  }

  if (loading) return (<div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>)

  const tabs = [
    { id: 'employees', label: 'Employees', count: employees.length, icon: Users },
    { id: 'departments', label: 'Departments', count: departments.length, icon: Building2 },
    { id: 'leaves', label: 'Leaves', count: leaves.length, icon: Calendar },
    { id: 'payrolls', label: 'Payroll', count: payrolls.length, icon: Wallet },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Human Resources"
        title="HRMS"
        description="Manage staff, departments, leaves, and payroll"
        actions={
          <Can permission="EMPLOYEE_MANAGE">
            <button onClick={() => openModal(activeTab.slice(0, -1))} className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> Add {activeTab === 'payrolls' ? 'Payroll' : activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}</button>
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
        {activeTab === 'employees' && (
          <div className="overflow-x-auto">
            {employees.length === 0 ? <EmptyState title="No employees" description="Add staff records" /> : (
              <table className="data-table">
                <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Designation</th><th>Salary</th><th>Actions</th></tr></thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e._id}>
                      <td>{e.employeeId}</td>
                      <td className="font-medium">{e.userId?.name || '—'}</td>
                      <td>{e.department}</td>
                      <td>{e.designation}</td>
                      <td>₹{e.salary}</td>
                      <td>
                        <Can permission="EMPLOYEE_MANAGE">
                          <button onClick={() => openModal('employee', e)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete('employee', e._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.length === 0 ? <EmptyState title="No departments" description="Add departments" /> : departments.map(d => (
              <div key={d._id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.name}</p>
                  <Can permission="EMPLOYEE_MANAGE">
                    <div className="flex gap-1"><button onClick={() => openModal('department', d)} className="icon-button h-7 w-7"><Pencil className="h-3 w-3" /></button><button onClick={() => handleDelete('department', d._id)} className="icon-button h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3 w-3" /></button></div>
                  </Can>
                </div>
                <p className="mt-1 text-xs text-slate-400">{d.code} • Head: {d.head?.name || '—'}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="overflow-x-auto">
            {leaves.length === 0 ? <EmptyState title="No leave requests" description="Track leave applications" /> : (
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l._id}>
                      <td>{l.employeeId?.employeeId}</td>
                      <td className="capitalize">{l.leaveType}</td>
                      <td className="text-xs">{new Date(l.fromDate).toLocaleDateString()}</td>
                      <td className="text-xs">{new Date(l.toDate).toLocaleDateString()}</td>
                      <td>{l.days}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${l.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : l.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{l.status}</span>
                      </td>
                      <td>
                        {l.status === 'pending' && (
                          <Can permission="EMPLOYEE_MANAGE">
                            <button onClick={() => handleLeaveStatus(l._id, 'approved')} className="icon-button h-8 w-8 text-emerald-600 hover:bg-emerald-50"><CheckCircle className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleLeaveStatus(l._id, 'rejected')} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50"><XCircle className="h-3.5 w-3.5" /></button>
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

        {activeTab === 'payrolls' && (
          <div className="overflow-x-auto">
            {payrolls.length === 0 ? <EmptyState title="No payroll records" description="Process monthly payroll" /> : (
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Month</th><th>Basic</th><th>Net</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {payrolls.map(p => (
                    <tr key={p._id}>
                      <td>{p.employeeId?.employeeId}</td>
                      <td>{p.month} {p.year}</td>
                      <td>₹{p.basicSalary}</td>
                      <td className="font-medium">₹{p.netSalary}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : p.status === 'processed' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{p.status}</span>
                      </td>
                      <td>
                        <Can permission="PAYROLL_MANAGE">
                          <button onClick={() => openModal('payroll', p)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete('payroll', p._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
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
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{formData._id ? 'Edit' : 'Add'} {modalType === 'payroll' ? 'Payroll' : modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2>
              <button onClick={closeModal} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {modalType === 'employee' && (
                <>
                  <input value={formData.employeeId || ''} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} className="field" placeholder="Employee ID" required />
                  <input value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })} className="field" placeholder="Department" required />
                  <input value={formData.designation || ''} onChange={e => setFormData({ ...formData, designation: e.target.value })} className="field" placeholder="Designation" required />
                  <select value={formData.employmentType || 'full_time'} onChange={e => setFormData({ ...formData, employmentType: e.target.value })} className="field"><option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option><option value="intern">Intern</option></select>
                  <input type="date" value={formData.joiningDate ? formData.joiningDate.split('T')[0] : ''} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} className="field" placeholder="Joining Date" />
                  <input type="number" value={formData.salary || ''} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} className="field" placeholder="Salary" />
                </>
              )}
              {modalType === 'department' && (
                <>
                  <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" placeholder="Department Name" required />
                  <input value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} className="field" placeholder="Department Code" required />
                </>
              )}
              {modalType === 'leave' && (
                <>
                  <select value={formData.employeeId || ''} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} className="field" required><option value="">Select Employee</option>{employees.map(e => <option key={e._id} value={e._id}>{e.userId?.name || e.employeeId}</option>)}</select>
                  <select value={formData.leaveType || 'sick'} onChange={e => setFormData({ ...formData, leaveType: e.target.value })} className="field"><option value="sick">Sick</option><option value="casual">Casual</option><option value="earned">Earned</option><option value="maternity">Maternity</option><option value="paternity">Paternity</option><option value="unpaid">Unpaid</option><option value="other">Other</option></select>
                  <input type="date" value={formData.fromDate ? formData.fromDate.split('T')[0] : ''} onChange={e => setFormData({ ...formData, fromDate: e.target.value })} className="field" required />
                  <input type="date" value={formData.toDate ? formData.toDate.split('T')[0] : ''} onChange={e => setFormData({ ...formData, toDate: e.target.value })} className="field" required />
                  <textarea value={formData.reason || ''} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="field" rows="2" placeholder="Reason" />
                </>
              )}
              {modalType === 'payroll' && (
                <>
                  <select value={formData.employeeId || ''} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} className="field" required><option value="">Select Employee</option>{employees.map(e => <option key={e._id} value={e._id}>{e.userId?.name || e.employeeId}</option>)}</select>
                  <div className="grid grid-cols-2 gap-4"><input value={formData.month || ''} onChange={e => setFormData({ ...formData, month: e.target.value })} className="field" placeholder="Month" required /><input type="number" value={formData.year || ''} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} className="field" placeholder="Year" required /></div>
                  <div className="grid grid-cols-2 gap-4"><input type="number" value={formData.basicSalary || ''} onChange={e => setFormData({ ...formData, basicSalary: Number(e.target.value) })} className="field" placeholder="Basic Salary" /><input type="number" value={formData.allowances || ''} onChange={e => setFormData({ ...formData, allowances: Number(e.target.value) })} className="field" placeholder="Allowances" /></div>
                  <div className="grid grid-cols-2 gap-4"><input type="number" value={formData.deductions || ''} onChange={e => setFormData({ ...formData, deductions: Number(e.target.value) })} className="field" placeholder="Deductions" /><input type="number" value={formData.tax || ''} onChange={e => setFormData({ ...formData, tax: Number(e.target.value) })} className="field" placeholder="Tax" /></div>
                  <div className="grid grid-cols-2 gap-4"><input type="number" value={formData.workingDays || ''} onChange={e => setFormData({ ...formData, workingDays: Number(e.target.value) })} className="field" placeholder="Working Days" /><input type="number" value={formData.paidDays || ''} onChange={e => setFormData({ ...formData, paidDays: Number(e.target.value) })} className="field" placeholder="Paid Days" /></div>
                  <select value={formData.status || 'draft'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="field"><option value="draft">Draft</option><option value="processed">Processed</option><option value="paid">Paid</option></select>
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

export default HRMSDashboard
