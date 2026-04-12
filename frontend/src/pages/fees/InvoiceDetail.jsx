import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { ArrowLeft, DollarSign, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const InvoiceDetail = () => {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentAmount, setPaymentAmount] = useState(0)

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      const response = await api.get(`/fees/invoice/${id}`)
      setInvoice(response.data.invoice)
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const recordPayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) return
    try {
      await api.post(`/fees/invoice/${id}/payment`, { amount: paymentAmount, paymentMode: 'cash' })
      toast.success('Payment recorded successfully')
      fetchInvoice()
      setPaymentAmount(0)
    } catch (error) {
      toast.error('Failed to record payment')
    }
  }

  const downloadReceipt = async () => {
    try {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/fees/invoice/${id}/receipt`, '_blank')
    } catch (error) {
      console.error('Failed to download receipt:', error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!invoice) return <div className="text-center py-12"><p className="text-gray-600">Invoice not found</p></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/fees/invoices" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Invoices
        </Link>
        {invoice.paidAmount > 0 && (
          <button onClick={downloadReceipt} className="btn btn-secondary inline-flex items-center">
            <Download className="w-4 h-4 mr-2" /> Download Receipt
          </button>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Details</h2>
            <div className="space-y-2">
              <p><span className="text-gray-500">Invoice No:</span> {invoice.invoiceNo}</p>
              <p><span className="text-gray-500">Student:</span> {invoice.studentId?.personalInfo?.firstName} {invoice.studentId?.personalInfo?.lastName}</p>
              <p><span className="text-gray-500">Class:</span> {invoice.classId?.name}</p>
              <p><span className="text-gray-500">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-2">
              <p><span className="text-gray-500">Total Amount:</span> ₹{invoice.totalAmount}</p>
              <p><span className="text-gray-500">Paid Amount:</span> <span className="text-green-600">₹{invoice.paidAmount}</span></p>
              <p><span className="text-gray-500">Balance:</span> <span className="text-red-600">₹{invoice.balanceAmount}</span></p>
              <p><span className="text-gray-500">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                  invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {invoice.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {invoice.balanceAmount > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
          <div className="flex gap-4">
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              placeholder="Enter amount"
              className="input flex-1"
            />
            <button onClick={recordPayment} className="btn btn-primary">Record Payment</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        {invoice.payments?.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-left py-2 px-4">Amount</th>
                <th className="text-left py-2 px-4">Mode</th>
                <th className="text-left py-2 px-4">Receipt No</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td className="py-2 px-4">₹{payment.amount}</td>
                  <td className="py-2 px-4 capitalize">{payment.paymentMode}</td>
                  <td className="py-2 px-4">{payment.receiptNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No payments recorded yet</p>
        )}
      </div>
    </div>
  )
}

export default InvoiceDetail
