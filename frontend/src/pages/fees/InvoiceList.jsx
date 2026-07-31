import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Download, Eye, ChevronLeft, ChevronRight, AlertTriangle, FilePlus } from 'lucide-react'
import { PageHeader, Skeleton, EmptyState, StatusBadge, TableToolbar } from '../../components/ui'

const InvoiceList = () => {
  const [tab, setTab] = useState('invoices')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const [defaulters, setDefaulters] = useState([])
  const [defaultersLoading, setDefaultersLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [quarterlyForm, setQuarterlyForm] = useState({ classId: '', quarter: '1', academicSession: '2024-25' })
  const [generating, setGenerating] = useState(false)

  useEffect(() => { fetchInvoices() }, [page])
  useEffect(() => { if (tab === 'defaulters') fetchDefaulters(); if (tab === 'quarterly') fetchClasses() }, [tab])

  const fetchInvoices = async () => {
    try { const response = await api.get(`/fees/invoice?page=${page}&limit=10`); setInvoices(response.data.data || response.data); setPagination(response.data.pagination || null) } catch (error) { console.error('Failed to fetch invoices:', error) } finally { setLoading(false) }
  }

  const fetchDefaulters = async () => {
    setDefaultersLoading(true)
    try {
      const { data } = await api.get('/fees/defaulters')
      setDefaulters(data.data || [])
    } catch (error) {
      console.error('Failed to fetch defaulters:', error)
    } finally {
      setDefaultersLoading(false)
    }
  }

  const fetchClasses = async () => {
    if (classes.length > 0) return
    try {
      const { data } = await api.get('/classes')
      setClasses(data.data || data.classes || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const handleGenerateQuarterly = async () => {
    if (!quarterlyForm.classId) { toast.error('Please select a class'); return }
    setGenerating(true)
    try {
      const { data } = await api.post('/fees/invoice/quarterly', quarterlyForm)
      if (data.success) {
        toast.success(`Generated ${data.data?.created || 0} invoices`)
        setTab('invoices')
        fetchInvoices()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate invoices')
    } finally {
      setGenerating(false)
    }
  }

  const downloadReceipt = async (invoiceId) => {
    try { const response = await api.get(`/fees/invoice/${invoiceId}/receipt`, { responseType: 'blob' }); const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = `receipt-${invoiceId}.pdf`; link.click(); URL.revokeObjectURL(url) } catch (error) { console.error('Failed to download receipt:', error) }
  }

  if (loading && tab === 'invoices') return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Finance" title="Fee Invoices" description="View and manage all fee invoices" actions={<><Link to="/fees/structure" className="btn btn-secondary whitespace-nowrap">Fee Structures</Link><Link to="/fees/invoices/new" className="btn btn-primary gap-2 whitespace-nowrap"><Plus className="h-4 w-4" />Create Invoice</Link></>} />

      <div className="flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        <button onClick={() => setTab('invoices')} className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'invoices' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}>All Invoices</button>
        <button onClick={() => setTab('defaulters')} className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'defaulters' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}>Fee Defaulters</button>
        <button onClick={() => setTab('quarterly')} className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'quarterly' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}>Quarterly Generation</button>
      </div>

      {tab === 'invoices' && (
        <div className="card overflow-hidden !p-0">
          <TableToolbar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search invoices..." />
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Invoice No</th><th>Student</th><th>Class</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th className="w-10"></th></tr></thead>
              <tbody>
                {Array.isArray(invoices) && invoices.length > 0 ? invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="font-mono text-xs font-medium text-slate-900 dark:text-white">{invoice.invoiceNo}</td>
                    <td className="font-medium text-slate-900 dark:text-white">{invoice.studentId?.personalInfo?.firstName} {invoice.studentId?.personalInfo?.lastName}</td>
                    <td>{invoice.classId?.name || '-'}</td>
                    <td className="font-medium">₹{invoice.totalAmount?.toLocaleString()}</td>
                    <td className="font-medium text-emerald-600">₹{invoice.paidAmount?.toLocaleString()}</td>
                    <td className="font-medium text-red-600">₹{invoice.balanceAmount?.toLocaleString()}</td>
                    <td><StatusBadge value={invoice.status} /></td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/fees/invoices/${invoice._id}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"><Eye className="h-3.5 w-3.5" />View</Link>
                        {invoice.paidAmount > 0 && <button onClick={() => downloadReceipt(invoice._id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"><Download className="h-3.5 w-3.5" />Receipt</button>}
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="8"><EmptyState title="No invoices" description="Generate your first fee invoice." action={<Link to="/fees/invoices/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />Create Invoice</Link>} /></td></tr>}
              </tbody>
            </table>
          </div>
          {pagination && <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800"><p className="text-sm text-slate-500">Showing {invoices.length} of {pagination.totalItems}</p><div className="flex gap-1"><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="icon-button h-8 w-8 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage} className="icon-button h-8 w-8 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>}
        </div>
      )}

      {tab === 'defaulters' && (
        <div className="card overflow-hidden !p-0">
          <div className="flex items-center gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Fee Defaulters List</h3>
            <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{defaulters.length} students</span>
          </div>
          {defaultersLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : defaulters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Class</th><th>Invoice No</th><th>Installment</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>
                  {defaulters.map((d) => (
                    <tr key={d._id}>
                      <td className="font-medium text-slate-900 dark:text-white">{d.studentName}</td>
                      <td>{d.className || '-'}</td>
                      <td className="font-mono text-xs">{d.invoiceNo}</td>
                      <td className="text-xs text-slate-500">{d.installmentLabel || '-'}</td>
                      <td className="font-medium">₹{d.totalAmount?.toLocaleString()}</td>
                      <td className="font-medium text-emerald-600">₹{d.paidAmount?.toLocaleString()}</td>
                      <td className="font-medium text-red-600">₹{d.balanceAmount?.toLocaleString()}</td>
                      <td className="text-sm">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '-'}</td>
                      <td><StatusBadge value={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No defaulters" description="All fees are paid up to date." />
          )}
        </div>
      )}

      {tab === 'quarterly' && (
        <div className="card max-w-2xl space-y-5 p-6">
          <div className="flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Generate Quarterly Invoices</h3>
          </div>
          <p className="text-sm text-slate-500">Generate fee invoices for an entire quarter for all students in a class. Transport fee will be included as a line item if the student has a transport allocation.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Class</label>
              <select value={quarterlyForm.classId} onChange={(e) => setQuarterlyForm({ ...quarterlyForm, classId: e.target.value })} className="field" required>
                <option value="">Select class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quarter</label>
              <select value={quarterlyForm.quarter} onChange={(e) => setQuarterlyForm({ ...quarterlyForm, quarter: e.target.value })} className="field" required>
                <option value="1">Q1 (Apr-Jun)</option>
                <option value="2">Q2 (Jul-Sep)</option>
                <option value="3">Q3 (Oct-Dec)</option>
                <option value="4">Q4 (Jan-Mar)</option>
              </select>
            </div>
            <div>
              <label className="label">Academic Session</label>
              <input type="text" value={quarterlyForm.academicSession} onChange={(e) => setQuarterlyForm({ ...quarterlyForm, academicSession: e.target.value })} className="field" required />
            </div>
          </div>
          <button onClick={handleGenerateQuarterly} disabled={generating} className="btn btn-primary gap-2">
            <FilePlus className="h-4 w-4" /> {generating ? 'Generating...' : 'Generate Invoices'}
          </button>
        </div>
      )}
    </div>
  )
}

export default InvoiceList
