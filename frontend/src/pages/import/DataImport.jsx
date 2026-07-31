import { useState, useRef } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader } from '../../components/ui'
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, FileUp } from 'lucide-react'

const DataImport = () => {
  const [module, setModule] = useState('students')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const templates = {
    students: `admissionNo,rollNo,firstName,lastName,dateOfBirth,gender,class,section,fatherName,motherName,fatherPhone,fatherEmail,address,academicSession
,001,Rahul,Sharma,2015-05-15,male,Class 1,A,Rajesh Sharma,Sunita Sharma,9876543210,rajesh@example.com,123 Main St,2024-2025
,002,Ananya,Patel,2014-08-22,female,Class 2,B,Seema Patel,Mahesh Patel,9876543211,seema@example.com,456 Park Rd,2024-2025`,
    teachers: `employeeId,firstName,lastName,email,phone,designation,gender,joinDate,qualification,subjects,basicSalary,totalSalary
,T001,Sunita,Verma,sunita@school.com,9876543220,Teacher,female,2022-06-01,M.Sc Mathematics,"Mathematics,Statistics",25000,35000
,T002,Rajesh,Kumar,rajesh@school.com,9876543221,Teacher,male,2021-07-01,M.A English,"English,Grammar",28000,38000`
  }

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim())
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row = {}
      headers.forEach((h, i) => row[h] = values[i])
      return row
    })
  }

  const handleTextChange = (text) => {
    setCsvText(text)
    setPreview(parseCSV(text))
    setResult(null)
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([templates[module]], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${module}-import-template.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      handleTextChange(text)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (preview.length === 0) { toast.error('No valid rows found'); return }
    setLoading(true)
    try {
      const blob = new Blob([csvText], { type: 'text/csv' })
      const formData = new FormData()
      formData.append('file', blob, `${module}-import.csv`)

      const res = await api.post(`/import/${module}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      if (res.data.imported > 0) {
        toast.success(`Imported ${res.data.imported} ${module}`)
      }
      if (res.data.failed > 0) {
        toast.error(`${res.data.failed} rows failed`)
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Import failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Data" title="Bulk Import" description="Import students and teachers from CSV" />

      <div className="card space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <select value={module} onChange={e => { setModule(e.target.value); handleTextChange(templates[e.target.value] || '') }} className="field max-w-xs">
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
          </select>
          <button onClick={handleDownloadTemplate} className="btn btn-secondary gap-2"><Download className="h-4 w-4" /> Download Template</button>
        </div>

        <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
          <FileUp className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Upload a CSV file or paste content below</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="btn btn-secondary mt-3 gap-2"><Upload className="h-4 w-4" /> Choose CSV File</button>
        </div>

        <textarea value={csvText} onChange={e => handleTextChange(e.target.value)} className="field min-h-[160px] font-mono text-sm" placeholder="Paste CSV here or upload a file..." />

        <button onClick={handleImport} disabled={loading || preview.length === 0} className="btn btn-primary gap-2"><Upload className="h-4 w-4" />{loading ? 'Importing...' : `Import ${preview.length} Rows`}</button>

        {preview.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="data-table">
              <thead><tr>{Object.keys(preview[0]).map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{preview.slice(0, 5).map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody>
            </table>
            {preview.length > 5 && <p className="p-3 text-xs text-slate-500">{preview.length - 5} more rows not shown</p>}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Import Result</h3>
            </div>
            <div className="mt-3 flex gap-4">
              <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle className="h-4 w-4" /> Imported: {result.imported}</span>
              <span className="flex items-center gap-1 text-sm text-red-600"><XCircle className="h-4 w-4" /> Failed: {result.failed}</span>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">
                    Row {err.row}: {err.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DataImport
