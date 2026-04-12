import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { ArrowLeft, DollarSign, Download, CheckCircle, Clock } from 'lucide-react'

const ChildFees = () => {
  const { childId } = useParams()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFees()
  }, [childId])

  const fetchFees = async () => {
    try {
      const response = await api.get('/fees/invoice')
      setInvoices(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch fees:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async (invoiceId) => {
    try {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/fees/invoice/${invoiceId}/receipt`, '_blank')
    } catch (error) {
      console.error('Failed to download receipt:', error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)

  return (
    <div className="space-y-6">
      <Link to="/parent" className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Parent Portal
      </Link>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Fee Summary</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Due</p>
            <p className="text-2xl font-bold text-red-600">₹{totalDue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Invoices</h3>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice._id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoiceNo}</p>
                  <p className="text-sm text-gray-600">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {invoice.status === 'paid' ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <CheckCircle className="w-3 h-3" /> Paid
                    </span>
                  ) : invoice.status === 'partial' ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      <Clock className="w-3 h-3" /> Partial
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">Pending</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total: ₹{invoice.totalAmount} | Paid: ₹{invoice.paidAmount} | Due: ₹{invoice.balanceAmount}</span>
                {invoice.paidAmount > 0 && (
                  <button onClick={() => downloadReceipt(invoice._id)} className="text-primary-600 hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" /> Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChildFees
