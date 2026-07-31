import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import { CreditCard, CheckCircle } from 'lucide-react'

const Payments = () => {
  const [invoices, setInvoices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchInvoices(), fetchTransactions()])
    setLoading(false)
  }

  const fetchInvoices = async () => { try { const res = await api.get('/payments/invoices'); setInvoices(res.data.data) } catch (error) { /* ignore */ } }
  const fetchTransactions = async () => { try { const res = await api.get('/payments/transactions'); setTransactions(res.data.data) } catch (error) { /* ignore */ } }

  const handlePay = async (invoice) => {
    setProcessingId(invoice._id)
    try {
      const orderRes = await api.post('/payments/order', {
        invoiceId: invoice._id,
        studentId: invoice.studentId?._id,
        amount: invoice.balanceAmount,
        gateway: 'test'
      })
      const { transactionId } = orderRes.data.data
      // In production, open Razorpay/Stripe checkout here using orderId.
      await api.post('/payments/verify', { transactionId, gatewayPaymentId: `pay_${Date.now()}`, gatewaySignature: 'test_signature' })
      toast.success('Payment recorded successfully')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed')
    } finally { setProcessingId(null) }
  }

  if (loading) return <div className="grid grid-cols-1 gap-6"><Skeleton className="h-64" /><Skeleton className="h-48" /></div>

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Payments" title="Online Payments" description="Pay school fees and view transaction history" />

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pending Fee Invoices</h3>
        {invoices.length === 0 ? <EmptyState title="No pending invoices" description="All fees are paid" /> : (
          <div className="mt-4 overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Invoice No</th><th>Student</th><th>Class</th><th>Due Date</th><th>Balance</th><th>Actions</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id}>
                    <td>{inv.invoiceNo}</td>
                    <td>{inv.studentId?.personalInfo?.firstName} {inv.studentId?.personalInfo?.lastName}</td>
                    <td>{inv.classId?.name} {inv.section}</td>
                    <td className="text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="font-medium">₹{inv.balanceAmount}</td>
                    <td>
                      <button onClick={() => handlePay(inv)} disabled={processingId === inv._id} className="btn btn-primary btn-sm gap-1"><CreditCard className="h-3.5 w-3.5" />{processingId === inv._id ? 'Processing...' : 'Pay'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
        {transactions.length === 0 ? <EmptyState title="No transactions" description="Payments will appear here" /> : (
          <div className="mt-4 overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Gateway</th><th>Status</th></tr></thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id}>
                    <td className="text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="font-medium">₹{t.amount}</td>
                    <td className="capitalize">{t.gateway}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${t.status === 'success' ? 'bg-emerald-50 text-emerald-700' : t.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {t.status === 'success' ? <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />{t.status}</span> : t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Payments
