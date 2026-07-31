import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, User, Receipt, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { PageHeader, Skeleton } from '../../components/ui'

const InvoiceForm = () => {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    studentId: '',
    feeStructureId: '',
    dueDate: ''
  })

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [studentResponse, structureResponse] = await Promise.all([
          api.get('/students?limit=100'),
          api.get('/fees/structure')
        ])
        setStudents(studentResponse.data.data || [])
        setStructures(structureResponse.data.feeStructures || [])
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load invoice options')
      } finally {
        setLoading(false)
      }
    }
    loadOptions()
  }, [])

  const selectedStudent = students.find((student) => student._id === formData.studentId)
  const availableStructures = useMemo(() => {
    if (!selectedStudent) return []
    const studentClassId = selectedStudent.classId?._id || selectedStudent.classId
    return structures.filter((structure) => (structure.classId?._id || structure.classId) === studentClassId)
  }, [selectedStudent, structures])
  const selectedStructure = structures.find((structure) => structure._id === formData.feeStructureId)
  const filteredStudents = students.filter((student) => {
    const text = `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''} ${student.admissionNo || ''}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const selectStudent = (studentId) => {
    setFormData({ ...formData, studentId, feeStructureId: '' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedStudent || !selectedStructure) {
      toast.error('Select a student and fee structure')
      return
    }

    setSaving(true)
    try {
      await api.post('/fees/invoice', {
        studentId: selectedStudent._id,
        feeStructureId: selectedStructure._id,
        dueDate: formData.dueDate,
        items: selectedStructure.fees.map((fee) => ({
          type: fee.type,
          name: fee.name,
          amount: Number(fee.amount),
          dueDate: fee.dueDate
        }))
      })
      toast.success('Invoice created successfully')
      navigate('/fees/invoices')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="space-y-5"><Skeleton className="h-24" /><Skeleton className="h-96" /></div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => navigate('/fees/invoices')} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Back to invoices</button>
      <PageHeader eyebrow="Finance" title="Create Invoice" description="Select a student and apply the fee structure for their class" />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2"><User className="h-4 w-4 text-indigo-600" /><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Select Student</h2></div>
          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="field pl-9" placeholder="Search by student name or admission number" />
          </label>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredStudents.map((student) => {
              const name = `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim()
              const selected = formData.studentId === student._id
              return (
                <button key={student._id} type="button" onClick={() => selectStudent(student._id)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${selected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10 dark:bg-indigo-500/10' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-600'}`}>
                  <div><p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p><p className="mt-0.5 text-xs text-slate-500">{student.admissionNo} · {student.classId?.name || 'No class'} {student.section ? `· Section ${student.section}` : ''}</p></div>
                  <span className={`h-4 w-4 rounded-full border ${selected ? 'border-indigo-600 bg-indigo-600 ring-2 ring-white dark:ring-slate-900' : 'border-slate-300 dark:border-slate-600'}`} />
                </button>
              )
            })}
            {filteredStudents.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No students match your search.</p>}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Fee Structure *</label>
              <select value={formData.feeStructureId} onChange={(event) => setFormData({ ...formData, feeStructureId: event.target.value })} className="field" required disabled={!selectedStudent}>
                <option value="">{selectedStudent ? 'Select fee structure' : 'Select a student first'}</option>
                {availableStructures.map((structure) => <option key={structure._id} value={structure._id}>{structure.name} — ₹{structure.totalAmount?.toLocaleString()}</option>)}
              </select>
              {selectedStudent && availableStructures.length === 0 && <p className="mt-1.5 text-xs text-amber-600">No fee structure exists for this student&apos;s class.</p>}
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input type="date" value={formData.dueDate} onChange={(event) => setFormData({ ...formData, dueDate: event.target.value })} className="field" required />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-indigo-600" /><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Invoice Summary</h2></div>
            {selectedStructure ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">Student</p><p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{selectedStudent?.personalInfo?.firstName} {selectedStudent?.personalInfo?.lastName}</p></div>
                <div className="space-y-2 border-b border-slate-100 pb-3 dark:border-slate-800">{selectedStructure.fees.map((fee) => <div key={fee._id || fee.name} className="flex items-center justify-between text-sm"><span className="text-slate-500">{fee.name}</span><span className="font-medium text-slate-900 dark:text-white">₹{Number(fee.amount).toLocaleString()}</span></div>)}</div>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-900 dark:text-white">Total</span><span className="text-xl font-bold text-indigo-600">₹{selectedStructure.totalAmount?.toLocaleString()}</span></div>
                {formData.dueDate && <div className="flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />Due {new Date(`${formData.dueDate}T00:00:00`).toLocaleDateString()}</div>}
              </div>
            ) : <p className="mt-4 text-sm leading-6 text-slate-500">Select a student and fee structure to preview the invoice.</p>}
          </div>
          <button type="submit" disabled={saving || !selectedStudent || !selectedStructure || !formData.dueDate} className="btn btn-primary w-full">{saving ? 'Creating...' : 'Create Invoice'}</button>
        </div>
      </form>
    </div>
  )
}

export default InvoiceForm
