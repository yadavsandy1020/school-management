import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { FileText, Award, Contact, Receipt, LayoutTemplate, History, Plus, Search, Eye, Download, Ban, X, Users, Settings } from 'lucide-react'
import api from '../../utils/api'
import Can from '../../components/Can'
import { PageHeader, EmptyState, LoadingState, Badge, SelectField, InputField } from '../../components/ui'

const TABS = [
  { key: 'certificates', label: 'Certificates', icon: Award },
  { key: 'marksheets', label: 'Marksheets', icon: FileText },
  { key: 'idcards', label: 'ID Cards', icon: Contact },
  { key: 'feedocs', label: 'Fee Documents', icon: Receipt },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate },
  { key: 'history', label: 'Generated Documents', icon: History },
]

export default function DocumentDashboard() {
  const [activeTab, setActiveTab] = useState('certificates')
  const [templates, setTemplates] = useState([])
  const [documents, setDocuments] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [variables, setVariables] = useState({})
  const [loading, setLoading] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Generation form state
  const [genForm, setGenForm] = useState({
    studentId: '', templateId: '', subType: '', examId: '',
    subjects: [], issueDate: new Date().toISOString().split('T')[0],
    remarks: '', customData: {}
  })
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [bulkStudents, setBulkStudents] = useState([])
  const [showBulk, setShowBulk] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  // Template editor state
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get('/documents/templates')
      if (data.success) setTemplates(data.data)
    } catch (err) { toast.error('Failed to load templates') }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get('/students', { params: { limit: 500 } })
      setStudents(data.data || data.students || [])
    } catch (err) { /* ignore */ }
  }, [])

  const fetchClasses = useCallback(async () => {
    try {
      const { data } = await api.get('/classes')
      setClasses(data.data || data || [])
    } catch (err) { /* ignore */ }
  }, [])

  const fetchExams = useCallback(async () => {
    try {
      const { data } = await api.get('/exams')
      setExams(data.data || data || [])
    } catch (err) { /* ignore */ }
  }, [])

  const fetchVariables = useCallback(async () => {
    try {
      const { data } = await api.get('/documents/variables')
      if (data.success) setVariables(data.data)
    } catch (err) { /* ignore */ }
  }, [])

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (filterType) params.documentType = filterType
      if (filterStatus) params.status = filterStatus
      if (search) params.search = search
      const { data } = await api.get('/documents', { params })
      if (data.success) {
        setDocuments(data.data)
        setTotal(data.total)
      }
    } catch (err) { toast.error('Failed to load documents') }
    finally { setLoading(false) }
  }, [page, filterType, filterStatus, search])

  useEffect(() => {
    fetchTemplates()
    fetchClasses()
    fetchVariables()
  }, [fetchTemplates, fetchClasses, fetchVariables])

  useEffect(() => {
    if (activeTab === 'history') fetchDocuments()
  }, [activeTab, fetchDocuments])

  useEffect(() => {
    if (activeTab === 'certificates' || activeTab === 'marksheets' || activeTab === 'idcards' || activeTab === 'feedocs') {
      fetchStudents()
      if (activeTab === 'marksheets') fetchExams()
    }
  }, [activeTab, fetchStudents, fetchExams])

  const getTemplatesForTab = (tab) => {
    const typeMap = { certificates: 'certificate', marksheets: 'marksheet', idcards: 'idcard', feedocs: 'feeDocument' }
    return templates.filter(t => t.documentType === typeMap[tab])
  }

  const handleSeedTemplates = async () => {
    try {
      const { data } = await api.post('/documents/templates/seed')
      if (data.success) {
        toast.success(data.message || 'Templates seeded')
        fetchTemplates()
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to seed templates') }
  }

  const handlePreview = async () => {
    if (!genForm.templateId || !genForm.studentId) {
      toast.error('Please select student and template')
      return
    }
    setGenLoading(true)
    try {
      const body = {
        studentId: genForm.studentId,
        templateId: genForm.templateId,
        documentType: getDocType(activeTab),
        subjects: genForm.subjects,
        examId: genForm.examId || undefined,
        remarks: genForm.remarks,
      }
      const response = await api.post('/documents/preview', body, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      setPreviewUrl(url)
      setShowPreview(true)
    } catch (err) { toast.error('Preview failed') }
    finally { setGenLoading(false) }
  }

  const handleGenerate = async () => {
    if (!genForm.templateId || !genForm.studentId) {
      toast.error('Please select student and template')
      return
    }
    setGenLoading(true)
    try {
      const body = {
        studentId: genForm.studentId,
        templateId: genForm.templateId,
        documentType: getDocType(activeTab),
        subType: genForm.subType,
        subjects: genForm.subjects,
        examId: genForm.examId || undefined,
        remarks: genForm.remarks,
        issueDate: genForm.issueDate,
      }
      const response = await api.post('/documents/generate', body, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${activeTab}-${Date.now()}.pdf`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Document generated successfully')
      setGenForm({ ...genForm, studentId: '', templateId: '' })
    } catch (err) { toast.error(err.response?.data?.error || 'Generation failed') }
    finally { setGenLoading(false) }
  }

  const handleBulkGenerate = async () => {
    if (!genForm.templateId || bulkStudents.length === 0) {
      toast.error('Select template and at least one student')
      return
    }
    setGenLoading(true)
    try {
      const { data } = await api.post('/documents/bulk-generate', {
        studentIds: bulkStudents,
        templateId: genForm.templateId,
        documentType: getDocType(activeTab),
        subType: genForm.subType,
        examId: genForm.examId || undefined,
      })
      toast.success(`Generated ${data.total} documents${data.failed ? `, ${data.failed} failed` : ''}`)
      setShowBulk(false)
      setBulkStudents([])
    } catch (err) { toast.error('Bulk generation failed') }
    finally { setGenLoading(false) }
  }

  const handleDownload = async (docId) => {
    try {
      const response = await api.get(`/documents/${docId}/regenerate`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `document-${docId}.pdf`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) { toast.error('Download failed') }
  }

  const handleVoid = async (docId) => {
    if (!confirm('Void this document? This action cannot be undone.')) return
    try {
      await api.put(`/documents/${docId}/void`, { reason: 'Manually voided' })
      toast.success('Document voided')
      fetchDocuments()
    } catch (err) { toast.error('Failed to void document') }
  }

  const handleSaveTemplate = async (templateData) => {
    try {
      if (editingTemplate?._id) {
        await api.put(`/documents/templates/${editingTemplate._id}`, templateData)
        toast.success('Template updated')
      } else {
        await api.post('/documents/templates', templateData)
        toast.success('Template created')
      }
      setShowTemplateModal(false)
      setEditingTemplate(null)
      fetchTemplates()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save template') }
  }

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Deactivate this template?')) return
    try {
      await api.delete(`/documents/templates/${id}`)
      toast.success('Template deactivated')
      fetchTemplates()
    } catch (err) { toast.error('Failed to deactivate template') }
  }

  const getDocType = (tab) => {
    const map = { certificates: 'certificate', marksheets: 'marksheet', idcards: 'idcard', feedocs: 'feeDocument' }
    return map[tab] || 'certificate'
  }

  const filteredStudents = students.filter(s => {
    if (!selectedClass) return true
    if (s.classId?._id !== selectedClass && s.classId !== selectedClass) return false
    if (selectedSection && s.section !== selectedSection) return false
    return true
  })

  const classSections = classes.find(c => c._id === selectedClass)?.sections || []

  // ─── Subject row management for marksheets ───
  const addSubject = () => {
    setGenForm({ ...genForm, subjects: [...genForm.subjects, { subjectName: '', maxMarks: 100, passingMarks: 33, theoryMarks: '', practicalMarks: '', obtainedMarks: '', total: '', grade: '', result: '' }] })
  }
  const updateSubject = (idx, field, value) => {
    const subjects = [...genForm.subjects]
    subjects[idx] = { ...subjects[idx], [field]: value }
    if (field === 'obtainedMarks' || field === 'maxMarks') {
      const obt = Number(subjects[idx].obtainedMarks || 0)
      const max = Number(subjects[idx].maxMarks || 100)
      subjects[idx].percentage = max > 0 ? ((obt / max) * 100).toFixed(1) : 0
      subjects[idx].grade = getGrade(obt, max)
      subjects[idx].result = obt >= Number(subjects[idx].passingMarks || 33) ? 'pass' : 'fail'
    }
    setGenForm({ ...genForm, subjects })
  }
  const removeSubject = (idx) => {
    setGenForm({ ...genForm, subjects: genForm.subjects.filter((_, i) => i !== idx) })
  }

  const getGrade = (obtained, max) => {
    const pct = max > 0 ? (obtained / max) * 100 : 0
    if (pct >= 90) return 'A1'
    if (pct >= 80) return 'A2'
    if (pct >= 70) return 'B1'
    if (pct >= 60) return 'B2'
    if (pct >= 50) return 'C1'
    if (pct >= 40) return 'C2'
    if (pct >= 33) return 'D'
    return 'E'
  }

  const calcTotal = () => {
    const total = genForm.subjects.reduce((sum, s) => sum + Number(s.maxMarks || 0), 0)
    const obtained = genForm.subjects.reduce((sum, s) => sum + Number(s.obtainedMarks || 0), 0)
    const pct = total > 0 ? ((obtained / total) * 100).toFixed(1) : 0
    return { total, obtained, pct, grade: getGrade(obtained, total), result: obtained >= total * 0.33 ? 'PASS' : 'FAIL' }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Documents"
        title="Certificate, Marksheet & Document Generator"
        description="Generate certificates, marksheets, ID cards, and fee documents with school branding"
        actions={
          <div className="flex gap-2">
            <a href="/documents/settings" className="btn btn-secondary gap-2">
              <Settings className="h-4 w-4" /> Document Settings
            </a>
            <Can permission="DOCUMENTS_TEMPLATE_MANAGE">
              {templates.length === 0 && (
                <button onClick={handleSeedTemplates} className="btn btn-primary gap-2">
                  <Plus className="h-4 w-4" /> Seed Default Templates
                </button>
              )}
            </Can>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'gradient-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Certificates / Marksheets / ID Cards / Fee Docs — Generation UI ─── */}
      {(activeTab === 'certificates' || activeTab === 'marksheets' || activeTab === 'idcards' || activeTab === 'feedocs') && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Configuration */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {activeTab === 'certificates' && 'Generate Certificate'}
                {activeTab === 'marksheets' && 'Generate Marksheet / Report Card'}
                {activeTab === 'idcards' && 'Generate ID Card'}
                {activeTab === 'feedocs' && 'Generate Fee Document'}
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Class & Section filter for student selection */}
                <SelectField
                  label="Filter by Class"
                  id="classFilter"
                  placeholder="All Classes"
                  value={selectedClass}
                  onChange={e => { setSelectedClass(e.target.value); setSelectedSection('') }}
                  options={classes.map(c => ({ value: c._id, label: c.name }))}
                />
                <SelectField
                  label="Filter by Section"
                  id="sectionFilter"
                  placeholder="All Sections"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  options={classSections.map(s => ({ value: s, label: s }))}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Select Student"
                  id="studentId"
                  placeholder="Choose a student"
                  value={genForm.studentId}
                  onChange={e => setGenForm({ ...genForm, studentId: e.target.value })}
                  options={filteredStudents.map(s => ({ value: s._id, label: `${s.personalInfo?.firstName} ${s.personalInfo?.lastName} (${s.admissionNo})` }))}
                  required
                />
                <SelectField
                  label="Select Template"
                  id="templateId"
                  placeholder="Choose a template"
                  value={genForm.templateId}
                  onChange={e => setGenForm({ ...genForm, templateId: e.target.value })}
                  options={getTemplatesForTab(activeTab).map(t => ({ value: t._id, label: t.name }))}
                  required
                />
              </div>

              {activeTab === 'marksheets' && (
                <>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Select Exam"
                      id="examId"
                      placeholder="Choose exam (optional)"
                      value={genForm.examId}
                      onChange={e => setGenForm({ ...genForm, examId: e.target.value })}
                      options={exams.map(e => ({ value: e._id, label: e.name }))}
                    />
                    <InputField
                      label="Issue Date"
                      type="date"
                      value={genForm.issueDate}
                      onChange={e => setGenForm({ ...genForm, issueDate: e.target.value })}
                    />
                  </div>

                  {/* Subjects table */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="label">Subjects & Marks</label>
                      <button type="button" onClick={addSubject} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                        <Plus className="inline h-3 w-3" /> Add Subject
                      </button>
                    </div>
                    {genForm.subjects.length === 0 ? (
                      <p className="text-xs text-slate-400">No subjects added. Click "Add Subject" to add marks.</p>
                    ) : (
                      <div className="space-y-2">
                        {genForm.subjects.map((subj, idx) => (
                          <div key={idx} className="flex flex-wrap gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                            <input className="field flex-1 min-w-[120px]" placeholder="Subject" value={subj.subjectName} onChange={e => updateSubject(idx, 'subjectName', e.target.value)} />
                            <input type="number" className="field w-20" placeholder="Max" value={subj.maxMarks} onChange={e => updateSubject(idx, 'maxMarks', Number(e.target.value))} />
                            <input type="number" className="field w-20" placeholder="Pass" value={subj.passingMarks} onChange={e => updateSubject(idx, 'passingMarks', Number(e.target.value))} />
                            <input type="number" className="field w-24" placeholder="Obtained" value={subj.obtainedMarks} onChange={e => updateSubject(idx, 'obtainedMarks', Number(e.target.value))} />
                            <span className="flex h-10 items-center rounded-lg bg-slate-100 px-3 text-sm font-medium dark:bg-slate-800">{subj.grade || '-'}</span>
                            <button type="button" onClick={() => removeSubject(idx)} className="icon-button h-10 w-10 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><X className="h-4 w-4" /></button>
                          </div>
                        ))}
                        {genForm.subjects.length > 0 && (
                          <div className="flex gap-4 rounded-lg bg-slate-50 p-3 text-sm font-medium dark:bg-slate-800/50">
                            <span>Total: {calcTotal().total}</span>
                            <span>Obtained: {calcTotal().obtained}</span>
                            <span>Percentage: {calcTotal().pct}%</span>
                            <span>Grade: {calcTotal().grade}</span>
                            <span>Result: {calcTotal().result}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'certificates' && (
                <div className="mt-4">
                  <InputField
                    label="Issue Date"
                    type="date"
                    value={genForm.issueDate}
                    onChange={e => setGenForm({ ...genForm, issueDate: e.target.value })}
                  />
                </div>
              )}

              {activeTab === 'feedocs' && (
                <div className="mt-4">
                  <InputField
                    label="Issue Date"
                    type="date"
                    value={genForm.issueDate}
                    onChange={e => setGenForm({ ...genForm, issueDate: e.target.value })}
                  />
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <button onClick={handlePreview} disabled={genLoading} className="btn btn-secondary gap-2">
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <Can permission="DOCUMENTS_GENERATE">
                  <button onClick={handleGenerate} disabled={genLoading} className="btn btn-primary gap-2">
                    <Download className="h-4 w-4" /> {genLoading ? 'Generating...' : 'Generate & Download'}
                  </button>
                </Can>
                <Can permission="DOCUMENTS_GENERATE">
                  <button onClick={() => { setShowBulk(true); fetchStudents() }} className="btn btn-secondary gap-2">
                    <Users className="h-4 w-4" /> Bulk Generate
                  </button>
                </Can>
              </div>
            </div>
          </div>

          {/* Right: Available Templates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Available Templates</h3>
            {getTemplatesForTab(activeTab).length === 0 ? (
              <EmptyState title="No templates" description="Seed default templates to get started" />
            ) : (
              <div className="space-y-2">
                {getTemplatesForTab(activeTab).map(tpl => (
                  <div
                    key={tpl._id}
                    onClick={() => setGenForm({ ...genForm, templateId: tpl._id })}
                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                      genForm.templateId === tpl._id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{tpl.name}</p>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="info">{tpl.design}</Badge>
                      {tpl.subType && <Badge>{tpl.subType}</Badge>}
                    </div>
                    {tpl.numbering?.prefix && (
                      <p className="mt-1 text-xs text-slate-400">Prefix: {tpl.numbering.prefix}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Templates Tab ─── */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Can permission="DOCUMENTS_TEMPLATE_MANAGE">
              <button onClick={() => { setEditingTemplate(null); setShowTemplateModal(true) }} className="btn btn-primary gap-2">
                <Plus className="h-4 w-4" /> New Template
              </button>
            </Can>
          </div>
          {templates.length === 0 ? (
            <EmptyState title="No templates" description="Seed default templates or create a custom one" action={
              <Can permission="DOCUMENTS_TEMPLATE_MANAGE">
                <button onClick={handleSeedTemplates} className="btn btn-primary">Seed Default Templates</button>
              </Can>
            } />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Type</th><th>Sub-Type</th><th>Design</th><th>Numbering Prefix</th><th>Actions</th></tr></thead>
                <tbody>
                  {templates.map(tpl => (
                    <tr key={tpl._id}>
                      <td className="font-medium">{tpl.name}</td>
                      <td><Badge variant="info">{tpl.documentType}</Badge></td>
                      <td>{tpl.subType || '-'}</td>
                      <td>{tpl.design}</td>
                      <td>{tpl.numbering?.prefix || '-'}</td>
                      <td>
                        <Can permission="DOCUMENTS_TEMPLATE_MANAGE">
                          <button onClick={() => { setEditingTemplate(tpl); setShowTemplateModal(true) }} className="icon-button h-8 w-8"><FileText className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteTemplate(tpl._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><X className="h-3.5 w-3.5" /></button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── History Tab ─── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by document number..." className="field h-10 pl-9" />
            </label>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} className="field h-10 w-40">
              <option value="">All Types</option>
              <option value="certificate">Certificates</option>
              <option value="marksheet">Marksheets</option>
              <option value="idcard">ID Cards</option>
              <option value="feeDocument">Fee Documents</option>
              <option value="report">Reports</option>
              <option value="letter">Letters / Notices</option>
              <option value="salarySlip">Salary Slips</option>
              <option value="admitCard">Admit Cards</option>
            </select>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="field h-10 w-32">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="void">Voided</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {loading ? <LoadingState /> : documents.length === 0 ? (
            <EmptyState title="No documents generated" description="Generated documents will appear here" />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Doc No.</th><th>Student</th><th>Adm No.</th><th>Type</th><th>Class</th><th>Generated By</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc._id}>
                      <td className="font-medium">{doc.documentNo}</td>
                      <td>{doc.studentId?.personalInfo?.firstName} {doc.studentId?.personalInfo?.lastName}</td>
                      <td>{doc.studentId?.admissionNo}</td>
                      <td><Badge variant="info">{doc.documentType}</Badge></td>
                      <td>{doc.classId?.name || '-'}</td>
                      <td>{doc.generatedBy?.name || '-'}</td>
                      <td className="text-sm">{new Date(doc.generatedAt).toLocaleDateString()}</td>
                      <td>{doc.status === 'active' ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Voided</Badge>}</td>
                      <td>
                        <button onClick={() => handleDownload(doc._id)} className="icon-button h-8 w-8" title="Download"><Download className="h-3.5 w-3.5" /></button>
                        <Can permission="DOCUMENTS_VOID">
                          {doc.status === 'active' && (
                            <button onClick={() => handleVoid(doc._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" title="Void"><Ban className="h-3.5 w-3.5" /></button>
                          )}
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm text-slate-500">{total} documents</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="icon-button h-8 w-8 disabled:opacity-30">Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={documents.length < 20} className="icon-button h-8 w-8 disabled:opacity-30">Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Preview Modal ─── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="fixed inset-0 bg-slate-950/50" onClick={() => { setShowPreview(false); if (previewUrl) URL.revokeObjectURL(previewUrl) }} />
          <div className="relative z-10 h-[90vh] w-full max-w-4xl rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold">Document Preview</h3>
              <button onClick={() => { setShowPreview(false); if (previewUrl) URL.revokeObjectURL(previewUrl) }} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <iframe src={previewUrl} className="h-[calc(90vh-60px)] w-full rounded-b-2xl" title="Preview" />
          </div>
        </div>
      )}

      {/* ─── Bulk Generation Modal ─── */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="fixed inset-0 bg-slate-950/50" onClick={() => setShowBulk(false)} />
          <div className="relative z-10 max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Bulk Generate Documents</h3>
              <button onClick={() => setShowBulk(false)} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-sm text-slate-500">Select students to generate documents in bulk.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SelectField label="Class" placeholder="All Classes" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection('') }} options={classes.map(c => ({ value: c._id, label: c.name }))} />
              <SelectField label="Section" placeholder="All Sections" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} options={classSections.map(s => ({ value: s, label: s }))} />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => setBulkStudents(filteredStudents.map(s => s._id))} className="text-xs font-medium text-indigo-600">Select All</button>
              <button onClick={() => setBulkStudents([])} className="text-xs font-medium text-slate-500">Clear</button>
              <span className="text-xs text-slate-400">{bulkStudents.length} selected</span>
            </div>

            <div className="mt-3 max-h-60 space-y-1 overflow-auto">
              {filteredStudents.map(s => (
                <label key={s._id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input type="checkbox" checked={bulkStudents.includes(s._id)} onChange={() => {
                    setBulkStudents(prev => prev.includes(s._id) ? prev.filter(id => id !== s._id) : [...prev, s._id])
                  }} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                  <span className="text-sm">{s.personalInfo?.firstName} {s.personalInfo?.lastName} ({s.admissionNo})</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowBulk(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleBulkGenerate} disabled={genLoading || !genForm.templateId || bulkStudents.length === 0} className="btn btn-primary gap-2">
                <Download className="h-4 w-4" /> {genLoading ? 'Generating...' : `Generate ${bulkStudents.length} Documents`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Template Editor Modal ─── */}
      {showTemplateModal && (
        <TemplateEditor
          template={editingTemplate}
          variables={variables}
          onSave={handleSaveTemplate}
          onClose={() => { setShowTemplateModal(false); setEditingTemplate(null) }}
        />
      )}
    </div>
  )
}

// ─── Template Editor Component ───
function TemplateEditor({ template, variables, onSave, onClose }) {
  const [form, setForm] = useState({
    name: template?.name || '',
    code: template?.code || '',
    documentType: template?.documentType || 'certificate',
    subType: template?.subType || '',
    design: template?.design || 'classic',
    title: template?.title || '',
    bodyText: template?.bodyText || '',
    footerText: template?.footerText || '',
    styling: template?.styling || { primaryColor: '#1e40af', secondaryColor: '#3b82f6', accentColor: '#f59e0b', showBorder: true, showLogo: true, showWatermark: false, watermarkText: '', titleFontSize: 18, bodyFontSize: 11 },
    layout: template?.layout || { orientation: 'portrait', marginTop: 40, marginBottom: 40, marginLeft: 40, marginRight: 40 },
    numbering: template?.numbering || { prefix: '', numberLength: 4, includeAcademicYear: true, separator: '/' },
    marksheetColumns: template?.marksheetColumns || { showTheory: false, showPractical: false, showMaxMarks: true, showPassMarks: false, showGrade: true, showPercentage: true, showRank: false, showRemarks: false },
    idCardFields: template?.idCardFields || { front: { showDOB: false, showBloodGroup: false, showParentPhone: true, showAddress: false, showQRCode: false, showSession: true }, back: { showSchoolAddress: true, showContact: true, showInstructions: true, showSignature: true } },
    signatures: template?.signatures || [{ label: 'Principal', variableName: 'principalName', position: 'left' }, { label: 'Manager', variableName: 'managerName', position: 'right' }],
  })
  const [showVarDropdown, setShowVarDropdown] = useState(false)

  const insertVariable = (varStr) => {
    setForm({ ...form, bodyText: form.bodyText + ' ' + varStr })
    setShowVarDropdown(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="fixed inset-0 bg-slate-950/50" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{template ? 'Edit Template' : 'New Template'}</h3>
          <button onClick={onClose} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Template Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <InputField label="Template Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
            <SelectField label="Document Type" value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })} options={[
              { value: 'certificate', label: 'Certificate' }, { value: 'marksheet', label: 'Marksheet' }, { value: 'idcard', label: 'ID Card' }, { value: 'feeDocument', label: 'Fee Document' }
            ]} />
            <InputField label="Sub-Type" value={form.subType} onChange={e => setForm({ ...form, subType: e.target.value })} placeholder="e.g. tc, bonafide, standard" />
            <SelectField label="Design" value={form.design} onChange={e => setForm({ ...form, design: e.target.value })} options={[
              { value: 'classic', label: 'Classic' }, { value: 'modern', label: 'Modern' }, { value: 'minimal', label: 'Minimal' }, { value: 'formal', label: 'Formal' }, { value: 'premium', label: 'Premium' }, { value: 'colorful', label: 'Colorful' }, { value: 'compact', label: 'Compact' }
            ]} />
            <SelectField label="Orientation" value={form.layout.orientation} onChange={e => setForm({ ...form, layout: { ...form.layout, orientation: e.target.value } })} options={[
              { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }
            ]} />
          </div>

          <InputField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. TRANSFER CERTIFICATE" />

          {/* Insert Variable Dropdown */}
          <div className="relative">
            <label className="label">Body Text</label>
            <div className="mb-2">
              <button type="button" onClick={() => setShowVarDropdown(!showVarDropdown)} className="btn btn-secondary h-8 gap-2 text-xs">
                <Plus className="h-3 w-3" /> Insert Variable
              </button>
              {showVarDropdown && (
                <div className="absolute z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {Object.entries(variables).map(([category, vars]) => (
                    <div key={category}>
                      <p className="px-3 py-1 text-xs font-semibold uppercase text-slate-400">{category}</p>
                      {vars.map(v => (
                        <button key={v.var} type="button" onClick={() => insertVariable(v.var)} className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                          <span>{v.label}</span>
                          <code className="text-xs text-slate-400">{v.var}</code>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <textarea className="field min-h-[120px]" value={form.bodyText} onChange={e => setForm({ ...form, bodyText: e.target.value })} placeholder="Use {{variables}} to insert dynamic data..." />
          </div>

          <InputField label="Footer Text" value={form.footerText} onChange={e => setForm({ ...form, footerText: e.target.value })} />

          {/* Styling */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Styling</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Primary Color</label>
                <input type="color" value={form.styling.primaryColor} onChange={e => setForm({ ...form, styling: { ...form.styling, primaryColor: e.target.value } })} className="h-10 w-full rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="label">Secondary Color</label>
                <input type="color" value={form.styling.secondaryColor} onChange={e => setForm({ ...form, styling: { ...form.styling, secondaryColor: e.target.value } })} className="h-10 w-full rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="label">Accent Color</label>
                <input type="color" value={form.styling.accentColor} onChange={e => setForm({ ...form, styling: { ...form.styling, accentColor: e.target.value } })} className="h-10 w-full rounded-lg border border-slate-200" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.styling.showBorder} onChange={e => setForm({ ...form, styling: { ...form.styling, showBorder: e.target.checked } })} className="h-4 w-4 rounded" /> Border</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.styling.showLogo} onChange={e => setForm({ ...form, styling: { ...form.styling, showLogo: e.target.checked } })} className="h-4 w-4 rounded" /> Logo</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.styling.showWatermark} onChange={e => setForm({ ...form, styling: { ...form.styling, showWatermark: e.target.checked } })} className="h-4 w-4 rounded" /> Watermark</label>
            </div>
          </div>

          {/* Numbering */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Certificate Numbering</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <InputField label="Prefix" value={form.numbering.prefix} onChange={e => setForm({ ...form, numbering: { ...form.numbering, prefix: e.target.value } })} placeholder="TC" />
              <InputField label="Number Length" type="number" value={form.numbering.numberLength} onChange={e => setForm({ ...form, numbering: { ...form.numbering, numberLength: Number(e.target.value) } })} />
              <InputField label="Separator" value={form.numbering.separator} onChange={e => setForm({ ...form, numbering: { ...form.numbering, separator: e.target.value } })} placeholder="/" />
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.numbering.includeAcademicYear} onChange={e => setForm({ ...form, numbering: { ...form.numbering, includeAcademicYear: e.target.checked } })} className="h-4 w-4 rounded" /> Include Academic Year</label>
          </div>

          {/* Marksheet columns (only for marksheet type) */}
          {form.documentType === 'marksheet' && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Marksheet Columns</p>
              <div className="mt-3 flex flex-wrap gap-4">
                {Object.entries(form.marksheetColumns).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={val} onChange={e => setForm({ ...form, marksheetColumns: { ...form.marksheetColumns, [key]: e.target.checked } })} className="h-4 w-4 rounded" />
                    {key.replace('show', '')}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Signatures</p>
              <button type="button" onClick={() => setForm({ ...form, signatures: [...form.signatures, { label: '', variableName: '', position: 'center' }] })} className="text-xs font-medium text-indigo-600"><Plus className="inline h-3 w-3" /> Add</button>
            </div>
            <div className="mt-3 space-y-2">
              {form.signatures.map((sig, i) => (
                <div key={i} className="flex gap-2">
                  <input className="field flex-1" placeholder="Label" value={sig.label} onChange={e => { const sigs = [...form.signatures]; sigs[i] = { ...sigs[i], label: e.target.value }; setForm({ ...form, signatures: sigs }) }} />
                  <select className="field w-40" value={sig.variableName} onChange={e => { const sigs = [...form.signatures]; sigs[i] = { ...sigs[i], variableName: e.target.value }; setForm({ ...form, signatures: sigs }) }}>
                    <option value="principalName">Principal</option>
                    <option value="managerName">Manager</option>
                    <option value="classTeacherName">Class Teacher</option>
                  </select>
                  <select className="field w-28" value={sig.position} onChange={e => { const sigs = [...form.signatures]; sigs[i] = { ...sigs[i], position: e.target.value }; setForm({ ...form, signatures: sigs }) }}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                  <button type="button" onClick={() => setForm({ ...form, signatures: form.signatures.filter((_, idx) => idx !== i) })} className="icon-button h-10 w-10 text-red-600"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Template</button>
          </div>
        </form>
      </div>
    </div>
  )
}
