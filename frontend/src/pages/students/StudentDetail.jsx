import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Calendar, User, CreditCard, Printer, GraduationCap, Bus, CheckCircle, XCircle, Clock, Download, FileDown, Plus, X, FileText } from 'lucide-react'
import { Skeleton, Avatar } from '../../components/ui'

const StudentDetail = () => {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [feeSummary, setFeeSummary] = useState({ total: 0, paid: 0, outstanding: 0 })
  const [invoices, setInvoices] = useState([])
  const [feeStructure, setFeeStructure] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1)
  const [attYear, setAttYear] = useState(new Date().getFullYear())
  const [attData, setAttData] = useState(null)
  const [attLoading, setAttLoading] = useState(false)

  const [transport, setTransport] = useState(null)
  const [transportLoading, setTransportLoading] = useState(false)
  const [routes, setRoutes] = useState([])
  const [showTransportModal, setShowTransportModal] = useState(false)
  const [transportForm, setTransportForm] = useState({ routeId: '', stopName: '', fare: 0 })

  const [studentDocs, setStudentDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)

  useEffect(() => { fetchStudent(); fetchFeeSummary() }, [id])
  useEffect(() => { if (student?.classId?._id) fetchFeeStructure() }, [student])
  useEffect(() => { if (activeTab === 'attendance') fetchAttendance() }, [activeTab, attMonth, attYear])
  useEffect(() => { if (activeTab === 'transport') fetchTransport() }, [activeTab])
  useEffect(() => { if (activeTab === 'documents') fetchStudentDocs() }, [activeTab])

  const fetchStudent = async () => {
    try { const response = await api.get(`/students/${id}`); setStudent(response.data.student) } catch (error) { console.error('Failed to fetch student:', error) }
  }

  const fetchFeeStructure = async () => {
    try {
      const classId = student?.classId?._id || student?.classId
      if (!classId) return
      const response = await api.get(`/fees/structure?classId=${classId}`)
      if (response.data.success && response.data.feeStructures?.length > 0) {
        setFeeStructure(response.data.feeStructures[0])
      }
    } catch (error) {
      console.error('Failed to fetch fee structure:', error)
    }
  }

  const fetchFeeSummary = async () => {
    try {
      // Fetch invoices for paid amount
      const invResponse = await api.get(`/fees/invoice?studentId=${id}&limit=100`)
      const invs = invResponse.data.data || []
      setInvoices(invs)
      const paid = invs.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0)

      // Fetch student to get classId and feeDiscount
      const stuResponse = await api.get(`/students/${id}`)
      const stu = stuResponse.data.student
      if (stu) setStudent(stu)

      // Fetch fee structure for the student's class
      let finalTotal = 0
      const classId = stu?.classId?._id || stu?.classId
      if (classId) {
        try {
          const fsResponse = await api.get(`/fees/structure?classId=${classId}`)
          if (fsResponse.data.success && fsResponse.data.feeStructures?.length > 0) {
            const fs = fsResponse.data.feeStructures[0]
            setFeeStructure(fs)
            const subtotal = Number(fs.totalAmount) || 0
            // Apply student discount
            let discountAmount = 0
            if (stu.feeDiscount && stu.feeDiscount.amount > 0) {
              if (stu.feeDiscount.type === 'percentage') {
                discountAmount = Math.round((subtotal * stu.feeDiscount.amount) / 100)
              } else {
                discountAmount = Number(stu.feeDiscount.amount)
              }
            }
            finalTotal = subtotal - discountAmount
          }
        } catch (e) {
          console.error('Failed to fetch fee structure for summary:', e)
        }
      }

      // If invoices exist, use invoice totals (they already have discount applied)
      // Otherwise use fee structure total minus discount
      const invoiceTotal = invs.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)
      const total = invoiceTotal > 0 ? invoiceTotal : finalTotal
      setFeeSummary({ total, paid, outstanding: total - paid })
    } catch (error) {
      console.error('Failed to fetch fee summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    setAttLoading(true)
    try {
      const { data } = await api.get(`/attendance/student/${id}/summary?month=${attMonth}&year=${attYear}`)
      if (data.success) setAttData(data)
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setAttLoading(false)
    }
  }

  const fetchTransport = async () => {
    setTransportLoading(true)
    try {
      const { data } = await api.get(`/transport/allocations/student/${id}`)
      if (data.success) {
        setTransport(data.data)
      } else {
        setTransport(null)
      }
    } catch (error) {
      setTransport(null)
    } finally {
      setTransportLoading(false)
    }
  }

  const fetchRoutes = async () => {
    try {
      const { data } = await api.get('/transport/routes')
      setRoutes(data.data || [])
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    }
  }

  const fetchStudentDocs = async () => {
    setDocsLoading(true)
    try {
      const { data } = await api.get(`/documents/student/${id}`)
      if (data.success) setStudentDocs(data.data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setDocsLoading(false)
    }
  }

  const handleDownloadDoc = async (docId) => {
    try {
      const response = await api.get(`/documents/${docId}/regenerate`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `document-${docId}.pdf`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const openTransportModal = async () => {
    await fetchRoutes()
    setTransportForm({ routeId: '', stopName: '', fare: 0 })
    setShowTransportModal(true)
  }

  const handleTransportSave = async (e) => {
    e.preventDefault()
    try {
      await api.post('/transport/allocations', {
        studentId: id,
        routeId: transportForm.routeId,
        stopName: transportForm.stopName,
        fare: Number(transportForm.fare) || 0
      })
      toast.success('Transport allocated successfully')
      setShowTransportModal(false)
      fetchTransport()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to allocate transport')
    }
  }

  const handleTransportDeactivate = async () => {
    if (!confirm('Remove transport allocation for this student?')) return
    try {
      await api.delete(`/transport/allocations/${transport._id}`)
      toast.success('Transport allocation removed')
      setTransport(null)
    } catch (error) {
      toast.error('Failed to remove transport')
    }
  }

  const downloadReceipt = async (invoiceId) => {
    try {
      const response = await api.get(`/fees/invoice/${invoiceId}/receipt`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `receipt-${invoiceId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download receipt:', error)
    }
  }

  const downloadPaymentReport = async () => {
    try {
      const response = await api.get(`/fees/student/${id}/payment-report`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `payment-report-${student?.admissionNo || id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download payment report:', error)
    }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-48" /><div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div></div>
  if (!student) return <div className="flex min-h-64 flex-col items-center justify-center text-center"><p className="text-slate-600 dark:text-slate-400">Student not found</p><Link to="/students" className="btn btn-primary mt-4">Back to Students</Link></div>

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'fees', label: 'Fee History' },
    { id: 'transport', label: 'Transport' },
    { id: 'documents', label: 'Documents' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/students" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Back to Students</Link>
        <div className="flex gap-2">
          <button className="btn btn-secondary gap-2"><Printer className="h-4 w-4" />Print ID Card</button>
          <Link to={`/students/${id}/edit`} className="btn btn-primary gap-2"><Pencil className="h-4 w-4" />Edit</Link>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar name={`${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`} className="h-20 w-20 text-lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{student.personalInfo?.firstName} {student.personalInfo?.lastName}</h1>
            <p className="mt-1 text-sm text-slate-500">Admission No: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{student.admissionNo}</span></p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"><GraduationCap className="h-3 w-3" />{student.classId?.name || '-'} - {student.section}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"><Calendar className="h-3 w-3" />Session: {student.academicSession}</span>
              {transport && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><Bus className="h-3 w-3" />Transport: {transport.routeId?.name}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Information</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[{ icon: User, label: 'Full Name', value: `${student.personalInfo?.firstName} ${student.personalInfo?.lastName}` }, { icon: Calendar, label: 'Date of Birth', value: student.personalInfo?.dateOfBirth ? new Date(student.personalInfo.dateOfBirth).toLocaleDateString() : '-' }, { icon: User, label: 'Gender', value: student.personalInfo?.gender || '-' }, { icon: User, label: 'Blood Group', value: student.personalInfo?.bloodGroup || '-' }].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><item.icon className="h-4 w-4 text-slate-500" /></div>
                    <div><p className="text-xs text-slate-500">{item.label}</p><p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Status card */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fee Status</h3>
              <div className="mt-4 space-y-3">
                {feeStructure && (
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Subtotal</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">₹{Number(feeStructure.totalAmount).toLocaleString()}</span>
                  </div>
                )}
                {student.feeDiscount && student.feeDiscount.amount > 0 && (
                  <>
                    <div className="flex items-center justify-between rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/10">
                      <span className="text-sm text-indigo-700 dark:text-indigo-300">Discount ({student.feeDiscount.type === 'percentage' ? `${student.feeDiscount.amount}%` : 'Fixed'})</span>
                      <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                        -₹{student.feeDiscount.type === 'percentage'
                          ? Math.round((Number(feeStructure?.totalAmount || 0) * student.feeDiscount.amount) / 100).toLocaleString()
                          : Number(student.feeDiscount.amount).toLocaleString()}
                      </span>
                    </div>
                    {student.feeDiscount.reason && (
                      <div className="flex items-center justify-between px-3 py-1">
                        <span className="text-xs text-slate-500">Reason</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{student.feeDiscount.reason}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10"><span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Final Amount</span><span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">₹{feeSummary.total.toLocaleString()}</span></div>
                <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10"><span className="text-sm text-amber-700 dark:text-amber-300">Paid</span><span className="text-sm font-bold text-amber-700 dark:text-amber-300">₹{feeSummary.paid.toLocaleString()}</span></div>
                <div className="flex items-center justify-between rounded-xl bg-red-50 p-3 dark:bg-red-500/10"><span className="text-sm text-red-700 dark:text-red-300">Outstanding</span><span className="text-sm font-bold text-red-700 dark:text-red-300">₹{feeSummary.outstanding.toLocaleString()}</span></div>

                {/* Installment breakdown */}
                {feeStructure?.installments?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Installment Schedule</p>
                    <div className="space-y-2">
                      {feeStructure.installments.map((inst, i) => {
                        const inv = invoices.find(inv => inv.installmentLabel === inst.label)
                        const instAmount = Math.round((feeSummary.total * inst.percentage) / 100)
                        const isPaid = inv?.status === 'paid'
                        const isPartial = inv?.status === 'partial'
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {isPaid ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : isPartial ? <Clock className="h-3.5 w-3.5 text-amber-500" /> : <Clock className="h-3.5 w-3.5 text-slate-400" />}
                              <span className="text-slate-700 dark:text-slate-300">{inst.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white">₹{instAmount.toLocaleString()}</span>
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${isPaid ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : isPartial ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Due'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button onClick={() => setActiveTab('fees')} className="btn btn-secondary w-full gap-2 text-xs"><CreditCard className="h-4 w-4" />View Fee History</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Contact Information</h3>
              <div className="mt-4 space-y-3">
                {[{ icon: Phone, label: 'Phone', value: student.contactInfo?.phone || '-' }, { icon: Mail, label: 'Email', value: student.contactInfo?.email || '-' }, { icon: MapPin, label: 'Address', value: [student.contactInfo?.address?.street, student.contactInfo?.address?.city, student.contactInfo?.address?.state, student.contactInfo?.address?.pincode].filter(Boolean).join(', ') || '-' }].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><item.icon className="h-4 w-4 text-slate-500" /></div>
                    <div><p className="text-xs text-slate-500">{item.label}</p><p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Parent / Guardian</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Father</p>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{student.parentInfo?.fatherName || '-'}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500"><span>{student.parentInfo?.fatherPhone || '-'}</span><span>{student.parentInfo?.fatherEmail || '-'}</span></div>
                </div>
                <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mother</p>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{student.parentInfo?.motherName || '-'}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500"><span>{student.parentInfo?.motherPhone || '-'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-end gap-4 p-4">
            <div>
              <label className="label">Month</label>
              <select value={attMonth} onChange={(e) => setAttMonth(Number(e.target.value))} className="field w-40">
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select value={attYear} onChange={(e) => setAttYear(Number(e.target.value))} className="field w-28">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {attLoading ? (
            <div className="card p-8 text-center text-slate-500">Loading attendance...</div>
          ) : attData ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{attData.statistics.totalWorkingDays}</p>
                  <p className="text-xs text-slate-500">Working Days</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{attData.statistics.presentDays}</p>
                  <p className="text-xs text-slate-500">Present</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{attData.statistics.absentDays}</p>
                  <p className="text-xs text-slate-500">Absent</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{attData.statistics.holidays}</p>
                  <p className="text-xs text-slate-500">Holidays</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{attData.statistics.percentage}%</p>
                  <p className="text-xs text-slate-500">Attendance</p>
                </div>
              </div>

              <div className="card overflow-x-auto">
                <h3 className="p-4 text-sm font-semibold text-slate-900 dark:text-white">Daily Calendar — {months[attMonth - 1]} {attYear}</h3>
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Day</th><th>Status</th></tr></thead>
                  <tbody>
                    {attData.calendar.map((day, i) => (
                      <tr key={i}>
                        <td className="text-sm">{new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td className="text-sm">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                        <td>
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                            day.status === 'present' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                            day.status === 'absent' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                            day.status === 'late' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                            day.status === 'holiday' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                            'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}>
                            {day.status === 'present' && <CheckCircle className="h-3 w-3" />}
                            {day.status === 'absent' && <XCircle className="h-3 w-3" />}
                            {day.status === 'late' && <Clock className="h-3 w-3" />}
                            {day.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center text-slate-500">No attendance data found</div>
          )}
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">₹{feeSummary.total.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Total Billed</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">₹{feeSummary.paid.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Total Paid</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">₹{feeSummary.outstanding.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Outstanding</p>
            </div>
          </div>

          {invoices.length > 0 && (
            <div className="flex justify-end">
              <button onClick={downloadPaymentReport} className="btn btn-primary gap-2"><FileDown className="h-4 w-4" />Download Complete Payment Report</button>
            </div>
          )}

          <div className="card overflow-x-auto">
            <h3 className="p-4 text-sm font-semibold text-slate-900 dark:text-white">Fee Invoices & Payment History</h3>
            {invoices.length > 0 ? (
              <table className="data-table">
                <thead><tr><th>Invoice No</th><th>Installment</th><th>Items</th><th>Subtotal</th><th>Discount</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Due Date</th><th>Payments</th><th></th></tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="font-mono text-xs font-medium">{inv.invoiceNo}</td>
                      <td className="text-xs">{inv.installmentLabel || inv.quarter || '-'}</td>
                      <td className="text-xs">
                        {inv.items?.map((item, i) => (
                          <div key={i}>{item.name}: ₹{item.amount?.toLocaleString()}</div>
                        ))}
                      </td>
                      <td className="text-sm">₹{inv.subtotal?.toLocaleString() || '-'}</td>
                      <td className="text-sm">
                        {inv.discount?.amount > 0 ? (
                          <span className="text-emerald-600">-₹{inv.discount.amount?.toLocaleString()}{inv.discount.reason ? ` (${inv.discount.reason})` : ''}</span>
                        ) : '-'}
                      </td>
                      <td className="font-medium">₹{inv.totalAmount?.toLocaleString()}</td>
                      <td className="font-medium text-emerald-600">₹{inv.paidAmount?.toLocaleString()}</td>
                      <td className="font-medium text-red-600">₹{inv.balanceAmount?.toLocaleString()}</td>
                      <td>
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                          inv.status === 'paid' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                          inv.status === 'partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          inv.status === 'overdue' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="text-xs">
                        {inv.payments?.length > 0 ? inv.payments.map((p, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span>₹{p.amount?.toLocaleString()} via {p.paymentMode} on {new Date(p.paymentDate).toLocaleDateString()}</span>
                            <button onClick={() => downloadReceipt(inv._id)} className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"><Download className="h-3 w-3" />Receipt</button>
                          </div>
                        )) : <span className="text-slate-400">No payments</span>}
                      </td>
                      <td>
                        {inv.paidAmount > 0 && (
                          <button onClick={() => downloadReceipt(inv._id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"><Download className="h-3.5 w-3.5" />Receipt</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500">No fee invoices found for this student</div>
            )}
          </div>

          {invoices.length > 0 && (
            <div className="card overflow-x-auto">
              <h3 className="p-4 text-sm font-semibold text-slate-900 dark:text-white">All Payment Transactions</h3>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Receipt No</th><th>Invoice No</th><th>Installment</th><th>Mode</th><th>Transaction ID</th><th>Amount</th><th></th></tr></thead>
                <tbody>
                  {invoices.flatMap(inv => (inv.payments || []).map((p, idx) => ({ ...p, invoiceNo: inv.invoiceNo, installmentLabel: inv.installmentLabel, invoiceId: inv._id, key: `${inv._id}-${idx}` }))).sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map((p) => (
                    <tr key={p.key}>
                      <td className="text-sm">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="font-mono text-xs">{p.receiptNo || '-'}</td>
                      <td className="font-mono text-xs">{p.invoiceNo}</td>
                      <td className="text-xs">{p.installmentLabel || '-'}</td>
                      <td className="capitalize text-sm">{p.paymentMode}</td>
                      <td className="text-xs">{p.transactionId || '-'}</td>
                      <td className="font-medium text-emerald-600">₹{p.amount?.toLocaleString()}</td>
                      <td>
                        <button onClick={() => downloadReceipt(p.invoiceId)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"><Download className="h-3 w-3" />Receipt</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transport' && (
        <div className="space-y-4">
          {transportLoading ? (
            <div className="card p-8 text-center text-slate-500">Loading transport info...</div>
          ) : transport ? (
            <>
              <div className="flex justify-end">
                <button onClick={handleTransportDeactivate} className="btn btn-danger gap-2"><X className="h-4 w-4" />Remove Transport</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4">
                  <div className="flex items-center gap-2 text-slate-500"><Bus className="h-4 w-4" /><span className="text-xs">Route</span></div>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{transport.routeId?.name || '-'}</p>
                  <p className="text-xs text-slate-500">{transport.routeId?.code || ''}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 text-slate-500"><MapPin className="h-4 w-4" /><span className="text-xs">Stop</span></div>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{transport.stopName || transport.pickupStop || '-'}</p>
                  {transport.dropStop && transport.dropStop !== transport.pickupStop && <p className="text-xs text-slate-500">Drop: {transport.dropStop}</p>}
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 text-slate-500"><CreditCard className="h-4 w-4" /><span className="text-xs">Monthly Fare</span></div>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">₹{transport.fare?.toLocaleString() || 0}</p>
                  <p className="text-xs text-slate-500">Quarterly: ₹{(transport.fare || 0) * 3}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 text-slate-500"><Bus className="h-4 w-4" /><span className="text-xs">Vehicle</span></div>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{transport.routeId?.vehicleId?.name || 'Not assigned'}</p>
                  <p className="text-xs text-slate-500">{transport.routeId?.vehicleId?.registrationNo || ''} • Cap: {transport.routeId?.vehicleId?.capacity || '-'}</p>
                </div>
              </div>

              {transport.routeId?.stops?.length > 0 && (
                <div className="card overflow-x-auto">
                  <h3 className="p-4 text-sm font-semibold text-slate-900 dark:text-white">Route Stops</h3>
                  <table className="data-table">
                    <thead><tr><th>Stop Name</th><th>Sequence</th><th>Pickup Time</th><th>Drop Time</th><th>Fare</th></tr></thead>
                    <tbody>
                      {transport.routeId.stops.map((stop, i) => (
                        <tr key={i} className={stop.name === transport.stopName ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}>
                          <td className="font-medium">{stop.name}{stop.name === transport.stopName && <span className="ml-2 text-xs text-indigo-600">(Assigned)</span>}</td>
                          <td className="text-sm">{stop.sequence}</td>
                          <td className="text-sm">{stop.pickupTime || '-'}</td>
                          <td className="text-sm">{stop.dropTime || '-'}</td>
                          <td className="text-sm">₹{stop.fare?.toLocaleString() || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="card p-8 text-center">
              <Bus className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">No transport allocated</p>
              <p className="mt-1 text-xs text-slate-400">This student does not have a transport route assigned.</p>
              <button onClick={openTransportModal} className="btn btn-primary mt-4 gap-2"><Plus className="h-4 w-4" />Opt for Transport</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Generated Documents</h3>
            <Link to="/documents" className="btn btn-primary gap-2 text-xs"><Plus className="h-4 w-4" />Generate New</Link>
          </div>
          {docsLoading ? (
            <div className="card p-8 text-center text-slate-500">Loading documents...</div>
          ) : studentDocs.length === 0 ? (
            <div className="card p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No documents generated for this student yet.</p>
              <Link to="/documents" className="btn btn-primary mt-4 gap-2 text-xs"><Plus className="h-4 w-4" />Generate Document</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Doc No.</th><th>Type</th><th>Sub-Type</th><th>Generated By</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {studentDocs.map(doc => (
                    <tr key={doc._id}>
                      <td className="font-medium">{doc.documentNo}</td>
                      <td className="capitalize">{doc.documentType}</td>
                      <td>{doc.subType || '-'}</td>
                      <td>{doc.generatedBy?.name || '-'}</td>
                      <td className="text-sm">{new Date(doc.generatedAt).toLocaleDateString()}</td>
                      <td>{doc.status === 'active' ? <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span> : <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Voided</span>}</td>
                      <td>
                        <button onClick={() => handleDownloadDoc(doc._id)} className="icon-button h-8 w-8" title="Download"><Download className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Allocate Transport</h2>
              <button onClick={() => setShowTransportModal(false)} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleTransportSave} className="mt-4 space-y-4">
              <div>
                <label className="label">Select Route</label>
                <select
                  value={transportForm.routeId}
                  onChange={e => {
                    const selectedRoute = routes.find(r => r._id === e.target.value)
                    setTransportForm({ ...transportForm, routeId: e.target.value, fare: selectedRoute?.fare || 0, stopName: '' })
                  }}
                  className="field"
                  required
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r._id} value={r._id}>{r.name} (₹{r.fare || 0}/month){r.vehicleId?.name ? ` - ${r.vehicleId.name}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Select Stop (optional)</label>
                <select
                  value={transportForm.stopName}
                  onChange={e => {
                    const selectedRoute = routes.find(r => r._id === transportForm.routeId)
                    const selectedStop = selectedRoute?.stops?.find(s => s.name === e.target.value)
                    const stopFare = selectedStop?.fare
                    setTransportForm({ ...transportForm, stopName: e.target.value, fare: stopFare !== undefined && stopFare > 0 ? stopFare : (selectedRoute?.fare || transportForm.fare || 0) })
                  }}
                  className="field"
                >
                  <option value="">Select Stop (optional)</option>
                  {routes.find(r => r._id === transportForm.routeId)?.stops?.map(s => (
                    <option key={s.name} value={s.name}>{s.name}{s.fare ? ` (₹${s.fare})` : ''}</option>
                  )) || []}
                </select>
              </div>
              <div>
                <label className="label">Monthly Fare (₹)</label>
                <input
                  type="number"
                  value={transportForm.fare || ''}
                  onChange={e => setTransportForm({ ...transportForm, fare: Number(e.target.value) })}
                  className="field"
                  placeholder="Monthly Fare"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">Quarterly fee will be ₹{(transportForm.fare || 0) * 3} (added to fee invoices automatically)</p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowTransportModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Allocate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDetail
