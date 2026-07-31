import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { Edit, ArrowLeft, Phone, Mail, Briefcase } from 'lucide-react'

const TeacherDetail = () => {
  const { id } = useParams()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeacher()
  }, [id])

  const fetchTeacher = async () => {
    try {
      const response = await api.get(`/teachers/${id}`)
      setTeacher(response.data.teacher)
    } catch (error) {
      console.error('Failed to fetch teacher:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!teacher) return <div className="text-center py-12"><p className="text-slate-500 dark:text-slate-400">Teacher not found</p></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/teachers" className="flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Teachers
        </Link>
        <Link to={`/teachers/${id}/edit`} className="btn btn-primary inline-flex items-center">
          <Edit className="w-4 h-4 mr-2" /> Edit Teacher
        </Link>
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Employee ID: {teacher.employeeId}</p>
        <p className="text-slate-500 dark:text-slate-400">{teacher.employmentDetails?.designation}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-slate-400" /><span className="text-slate-700 dark:text-slate-300">{teacher.contactInfo?.phone || '-'}</span></div>
            <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-slate-400" /><span className="text-slate-700 dark:text-slate-300">{teacher.contactInfo?.email || '-'}</span></div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Employment Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-slate-400" /><span className="text-slate-700 dark:text-slate-300">{teacher.employmentDetails?.designation}</span></div>
            <p className="text-slate-600 dark:text-slate-400">Join Date: {teacher.employmentDetails?.joinDate ? new Date(teacher.employmentDetails.joinDate).toLocaleDateString() : '-'}</p>
            <p className="text-slate-600 dark:text-slate-400">Type: {teacher.employmentDetails?.employmentType}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Salary Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase">Total Salary</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">₹{(teacher.salaryStats?.total || 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase">Paid</p>
            <p className="text-xl font-bold text-emerald-600">₹{(teacher.salaryStats?.paid || 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase">Outstanding</p>
            <p className="text-xl font-bold text-rose-600">₹{(teacher.salaryStats?.outstanding || 0).toLocaleString()}</p>
          </div>
        </div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Recent Payments</h4>
        <div className="space-y-2">
          {teacher.salaryPayments?.length ? teacher.salaryPayments.map((p) => (
            <div key={p._id} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">{new Date(p.paymentDate).toLocaleDateString()} • {p.month}/{p.year}</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{p.amount.toLocaleString()}</span>
            </div>
          )) : <p className="text-sm text-slate-500 dark:text-slate-400">No payments recorded.</p>}
        </div>
      </div>
    </div>
  )
}

export default TeacherDetail
