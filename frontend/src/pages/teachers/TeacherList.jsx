import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Eye, Pencil, Trash2, Download } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState, EmptyState, TableToolbar, Pagination, ConfirmDialog } from '../../components/ui'

const TeacherList = () => {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [teacherToDelete, setTeacherToDelete] = useState(null)

  useEffect(() => { fetchTeachers() }, [page, searchTerm])

  const fetchTeachers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit: 10, ...(searchTerm && { search: searchTerm }) })
      const response = await api.get(`/teachers?${params}`)
      setTeachers(response.data.data || [])
      setPagination(response.data.pagination || null)
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/teachers/${id}`)
      toast.success('Teacher deleted')
      fetchTeachers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete teacher')
    } finally {
      setTeacherToDelete(null)
    }
  }

  if (loading && teachers.length === 0 && !error) return <LoadingState message="Loading teachers..." />
  if (error) return <ErrorState title="Unable to load teachers" message={error} onRetry={fetchTeachers} />

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Staff" title="Teachers & Staff" description="Manage teacher and staff records" actions={<Link to="/teachers/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />Add Teacher</Link>} />

      <div className="card overflow-hidden !p-0">
        <TableToolbar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search teachers..." exportAction={<button className="icon-button" aria-label="Export CSV"><Download className="h-4 w-4" /></button>} />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Employee ID</th><th>Name</th><th>Designation</th><th>Phone</th><th>Email</th><th>Total Salary</th><th>Paid</th><th>Outstanding</th><th className="w-10"></th></tr></thead>
            <tbody>
              {Array.isArray(teachers) && teachers.length > 0 ? teachers.map((teacher) => (
                <tr key={teacher._id}>
                  <td className="font-mono text-xs font-medium text-slate-900 dark:text-white">{teacher.employeeId}</td>
                  <td className="font-medium text-slate-900 dark:text-white">{teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName}</td>
                  <td>{teacher.employmentDetails?.designation || '-'}</td>
                  <td>{teacher.contactInfo?.phone || '-'}</td>
                  <td>{teacher.contactInfo?.email || '-'}</td>
                  <td className="text-slate-600 dark:text-slate-300">₹{(teacher.salaryStats?.total || 0).toLocaleString()}</td>
                  <td className="text-emerald-600">₹{(teacher.salaryStats?.paid || 0).toLocaleString()}</td>
                  <td className="text-rose-600">₹{(teacher.salaryStats?.outstanding || 0).toLocaleString()}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => navigate(`/teachers/${teacher._id}`)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"><Eye className="h-3.5 w-3.5" />View</button>
                      <button onClick={() => navigate(`/teachers/${teacher._id}/edit`)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"><Pencil className="h-3.5 w-3.5" />Edit</button>
                      <button onClick={() => setTeacherToDelete(teacher)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="9"><EmptyState title="No teachers" description="Add your first teacher." action={<Link to="/teachers/new" className="btn btn-primary gap-2"><Plus className="h-4 w-4" />Add Teacher</Link>} /></td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          hasPrev={page > 1}
          hasNext={!!pagination?.hasNextPage}
          onChange={(newPage) => setPage(newPage)}
          totalText={pagination ? `Showing ${teachers.length} of ${pagination.totalItems}` : ''}
        />
      </div>

      <ConfirmDialog
        open={!!teacherToDelete}
        title="Delete teacher"
        message={teacherToDelete ? `Are you sure you want to delete ${teacherToDelete.personalInfo?.firstName} ${teacherToDelete.personalInfo?.lastName}? This action cannot be undone.` : ''}
        onCancel={() => setTeacherToDelete(null)}
        onConfirm={() => teacherToDelete && handleDelete(teacherToDelete._id)}
      />
    </div>
  )
}

export default TeacherList
