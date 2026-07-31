import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Download, Eye, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState, EmptyState, TableToolbar, SelectField, Pagination, ConfirmDialog, Checkbox } from '../../components/ui'

const StudentList = () => {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [feeQuarter, setFeeQuarter] = useState('')
  const [academicSession, setAcademicSession] = useState('')
  const [feeDefaulters, setFeeDefaulters] = useState([])
  const [totalDue, setTotalDue] = useState(0)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [studentToDelete, setStudentToDelete] = useState(null)

  useEffect(() => { fetchClasses(); fetchSchoolConfig() }, [])
  useEffect(() => { fetchStudents() }, [page, searchTerm, filterClass, feeQuarter, academicSession])

  const fetchSchoolConfig = async () => {
    try {
      const res = await api.get('/customization')
      const session = res.data.customization?.academicSession
      if (session) setAcademicSession(session)
    } catch (error) {
      console.error('Failed to load school config:', error)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes?limit=100')
      setClasses(response.data.data || response.data || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    setError(null)
    try {
      if (feeQuarter) {
        const params = new URLSearchParams({ quarter: feeQuarter })
        if (academicSession) params.append('academicSession', academicSession)
        if (filterClass) params.append('classId', filterClass)
        const response = await api.get(`/fees/defaulters?${params}`)
        setFeeDefaulters(response.data.data || [])
        setTotalDue(response.data.totalDue || 0)
        setStudents([])
        setPagination(null)
      } else {
        const params = new URLSearchParams({ page, limit: 10, ...(searchTerm && { search: searchTerm }), ...(filterClass && { classId: filterClass }) })
        const response = await api.get(`/students?${params}`)
        setStudents(response.data.data || [])
        setPagination(response.data.pagination || null)
        setFeeDefaulters([])
      }
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to load students'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/students/${id}`)
      toast.success('Student deleted')
      fetchStudents()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete student')
    } finally {
      setStudentToDelete(null)
    }
  }

  const exportCSV = async () => {
    try {
      const response = await api.get('/reports/export/students', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'students.csv'
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Export started')
    } catch (error) {
      toast.error('Failed to export students')
    }
  }

  const classOptions = classes.map((c) => ({ value: c._id, label: c.name }))
  const quarterOptions = [
    { value: '', label: 'All Students' },
    { value: 'Q1', label: 'Fee Pending: Q1' },
    { value: 'Q2', label: 'Fee Pending: Q2' },
    { value: 'Q3', label: 'Fee Pending: Q3' },
    { value: 'Q4', label: 'Fee Pending: Q4' },
  ]

  if (loading && students.length === 0 && feeDefaulters.length === 0 && !error) return <LoadingState message="Loading students..." />
  if (error) return <ErrorState title="Unable to load students" message={error} onRetry={fetchStudents} />

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Manage" title="Students" description="View, search, and manage all student records" />

      <div className="card overflow-hidden !p-0">
        <TableToolbar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, admission no..."
          filters={
            <div className="flex flex-wrap gap-2">
              <SelectField value={feeQuarter} onChange={(e) => { setPage(1); setFeeQuarter(e.target.value) }} options={quarterOptions} placeholder="Fee Filter" className="w-full sm:w-44" />
              <SelectField value={filterClass} onChange={(e) => { setPage(1); setFilterClass(e.target.value) }} options={classOptions} placeholder="All Classes" className="w-full sm:w-36" />
            </div>
          }
          exportAction={<button onClick={exportCSV} className="icon-button" aria-label="Export CSV"><Download className="h-4 w-4" /></button>}
        />

        {feeQuarter && feeDefaulters.length > 0 && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {feeDefaulters.length} students with pending fees for {feeQuarter} — Total due: ₹{totalDue.toLocaleString()}
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          {feeQuarter ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Invoice No</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Parent Phone</th>
                </tr>
              </thead>
              <tbody>
                {feeDefaulters.length > 0 ? (
                  feeDefaulters.map((d) => (
                    <tr key={d.invoiceId}>
                      <td className="font-mono text-xs font-medium text-slate-900 dark:text-white">{d.admissionNo}</td>
                      <td className="font-medium text-slate-900 dark:text-white">{d.studentName}</td>
                      <td>{d.className || '-'}</td>
                      <td>{d.section || '-'}</td>
                      <td className="font-mono text-xs">{d.invoiceNo}</td>
                      <td className="font-medium">₹{d.totalAmount?.toLocaleString()}</td>
                      <td className="font-medium text-emerald-600">₹{d.paidAmount?.toLocaleString()}</td>
                      <td className="font-medium text-red-600">₹{d.balanceAmount?.toLocaleString()}</td>
                      <td>
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                          d.status === 'overdue' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                          d.status === 'partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>{d.status}</span>
                      </td>
                      <td className="text-sm">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="text-sm">{d.parentPhone || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11">
                      <EmptyState title="No fee defaulters" description={`All students have paid fees for ${feeQuarter}.`} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10"><Checkbox /></th>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Parent</th>
                  <th>Phone</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(students) && students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student._id}>
                      <td><Checkbox /></td>
                      <td className="font-mono text-xs font-medium text-slate-900 dark:text-white">{student.admissionNo}</td>
                      <td className="font-medium text-slate-900 dark:text-white"><Link to={`/students/${student._id}`} className="hover:text-indigo-600">{student.personalInfo?.firstName} {student.personalInfo?.lastName}</Link></td>
                      <td>{student.classId?.name || '-'}</td>
                      <td>{student.section}</td>
                      <td>{student.parentInfo?.fatherName || '-'}</td>
                      <td>{student.contactInfo?.phone || '-'}</td>
                      <td>
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => navigate(`/students/${student._id}`)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"><Eye className="h-3.5 w-3.5" />View</button>
                          <button onClick={() => navigate(`/students/${student._id}/edit`)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"><Pencil className="h-3.5 w-3.5" />Edit</button>
                          <button onClick={() => setStudentToDelete(student)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <EmptyState title="No students found" description="Approve admissions to add students." action={<Link to="/admissions/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />New Admission</Link>} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!feeQuarter && (
          <Pagination
            page={page}
            hasPrev={page > 1}
            hasNext={!!pagination?.hasNextPage}
            onChange={(newPage) => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPage(newPage) }}
            totalText={pagination ? `Showing ${students.length} of ${pagination.totalItems} students` : ''}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!studentToDelete}
        title="Delete student"
        message={studentToDelete ? `Are you sure you want to delete ${studentToDelete.personalInfo?.firstName} ${studentToDelete.personalInfo?.lastName}? This action cannot be undone.` : ''}
        onCancel={() => setStudentToDelete(null)}
        onConfirm={() => studentToDelete && handleDelete(studentToDelete._id)}
      />
    </div>
  )
}

export default StudentList
