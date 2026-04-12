import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { DollarSign, Download } from 'lucide-react'

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/fees/invoice')
      setInvoices(response.data.data || response.data)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async (invoiceId) => {
    try {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/fees/invoice/${invoiceId}/receipt`, '_blank')
    } catch (error) {
      console.error('Failed to download receipt:', error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fee Invoices</h1>
        <p className="text-gray-600 mt-1">View and manage fee invoices</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice No</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Paid</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Balance</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(invoices) && invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{invoice.invoiceNo}</td>
                  <td className="py-3 px-4">{invoice.studentId?.personalInfo?.firstName} {invoice.studentId?.personalInfo?.lastName}</td>
                  <td className="py-3 px-4">{invoice.classId?.name || '-'}</td>
                  <td className="py-3 px-4">₹{invoice.totalAmount}</td>
                  <td className="py-3 px-4 text-green-600">₹{invoice.paidAmount}</td>
                  <td className="py-3 px-4 text-red-600">₹{invoice.balanceAmount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/fees/invoices/${invoice._id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                      {invoice.paidAmount > 0 && (
                        <button onClick={() => downloadReceipt(invoice._id)} className="p-2 text-green-600 hover:bg-green-50 rounded">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="py-8 text-center text-gray-500">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InvoiceList
