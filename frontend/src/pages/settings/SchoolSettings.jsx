import { useEffect, useState, useMemo } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Building2, Phone, FileText, Hash, Eye, Save } from 'lucide-react'
import { PageHeader } from '../../components/ui'

const Input = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label className="label">{label}</label>
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="field" />
  </div>
)

const entityTypes = [
  { key: 'student', label: 'Student' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'employee', label: 'Employee' },
  { key: 'admission', label: 'Admission' },
  { key: 'parent', label: 'Parent' },
  { key: 'book', label: 'Library Book' },
  { key: 'libraryIssue', label: 'Library Issue' },
  { key: 'invoice', label: 'Fee Invoice' },
  { key: 'feeReceipt', label: 'Fee Receipt' },
  { key: 'expense', label: 'Expense' },
  { key: 'salarySlip', label: 'Salary Slip' },
  { key: 'purchaseOrder', label: 'Purchase Order' },
  { key: 'transportRoute', label: 'Transport Route' },
  { key: 'hostelRoom', label: 'Hostel Room' },
  { key: 'payment', label: 'Payment' },
  { key: 'notice', label: 'Notice' },
  { key: 'exam', label: 'Exam' },
  { key: 'class', label: 'Class' }
]

const documentTypes = [
  'feeReceipt', 'invoice', 'studentIdCard', 'employeeIdCard', 'bonafideCertificate',
  'characterCertificate', 'transferCertificate', 'reportCard', 'progressCard',
  'admitCard', 'hallTicket', 'salarySlip', 'appointmentLetter', 'experienceLetter',
  'leavingCertificate', 'admissionForm', 'notice', 'circular', 'homework',
  'timetable', 'libraryReceipt', 'transportReceipt', 'hostelReceipt'
]

const sampleDataByType = {
  feeReceipt: {
    receiptNumber: 'REC-2026-00001',
    paymentDate: new Date().toLocaleDateString(),
    amount: 15000,
    transactionId: 'TXN123456',
    student: 'Rahul Sharma',
    invoice: {
      invoiceNumber: 'INV-2026-00001',
      totalAmount: 30000,
      paidAmount: 15000,
      balanceAmount: 15000,
      items: [{ name: 'Tuition Fee', amount: 15000 }]
    }
  },
  invoice: {
    invoice: {
      invoiceNumber: 'INV-2026-00001',
      studentName: 'Rahul Sharma',
      className: 'Class 5-A',
      dueDate: new Date().toLocaleDateString(),
      totalAmount: 30000,
      paidAmount: 15000,
      status: 'partial',
      items: [{ name: 'Tuition Fee', amount: 20000 }, { name: 'Transport Fee', amount: 10000 }]
    }
  },
  studentIdCard: {
    student: { name: 'Rahul Sharma', admissionNo: 'STU-2026-00001', className: 'Class 5', section: 'A', session: '2025-26' }
  },
  employeeIdCard: {
    employee: { name: 'Anita Verma', employeeId: 'EMP-2026-00001', designation: 'Teacher', department: 'Mathematics' }
  },
  bonafideCertificate: {
    student: { name: 'Rahul Sharma', admissionNo: 'STU-2026-00001', className: 'Class 5-A' }
  },
  characterCertificate: {
    student: { name: 'Rahul Sharma', admissionNo: 'STU-2026-00001' }
  },
  transferCertificate: {
    student: { name: 'Rahul Sharma', fatherName: 'Mr. Sharma', className: 'Class 5-A' }
  },
  reportCard: {
    student: { name: 'Rahul Sharma' },
    exam: { name: 'Final Exam 2025-26' },
    marks: [
      { subject: 'Mathematics', marksObtained: 85, maxMarks: 100 },
      { subject: 'Science', marksObtained: 78, maxMarks: 100 }
    ]
  },
  salarySlip: {
    payroll: { employeeName: 'Anita Verma', month: 'March', year: 2025, basicSalary: 25000, netSalary: 28000 }
  },
  admitCard: {
    student: { name: 'Rahul Sharma', admissionNo: 'STU-2026-00001' },
    exam: { name: 'Final Exam 2025-26' }
  },
  hallTicket: {
    student: { name: 'Rahul Sharma', admissionNo: 'STU-2026-00001' },
    exam: { name: 'Final Exam 2025-26' }
  },
  notice: {
    title: 'Annual Day Celebration',
    date: new Date().toLocaleDateString(),
    content: 'The Annual Day will be celebrated on 15th March 2025. All students and parents are invited.'
  },
  libraryReceipt: {
    bookTitle: 'Science for Class 5',
    issueNumber: 'LIB-2026-00001',
    studentName: 'Rahul Sharma',
    dueDate: new Date().toLocaleDateString()
  },
  transportReceipt: {
    routeName: 'Route A - City Center',
    studentName: 'Rahul Sharma',
    amount: 1200
  },
  hostelReceipt: {
    hostelName: 'Boys Hostel',
    roomNo: 'RM-001',
    studentName: 'Rahul Sharma',
    amount: 5000
  }
}

const SchoolSettings = () => {
  const [activeTab, setActiveTab] = useState('branding')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewType, setPreviewType] = useState('feeReceipt')
  const [selectedTemplate, setSelectedTemplate] = useState('feeReceipt')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/customization')
      setData(res.data.customization)
    } catch (err) {
      toast.error('Failed to load settings')
    }
  }

  const updateSection = async (endpoint, payload, key) => {
    setLoading(true)
    try {
      const res = await api.put(`/customization/${endpoint}`, payload)
      setData((prev) => ({ ...prev, [key]: res.data[key] }))
      toast.success('Saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAssetUpload = async (field, file) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/customization/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { field }
      })
      toast.success('Asset uploaded')
      fetchData()
    } catch (err) {
      toast.error('Upload failed')
    }
  }

  const handlePreview = async () => {
    setLoading(true)
    try {
      const payload = sampleDataByType[previewType] || {}
      const res = await api.post(`/customization/preview/${previewType}`, payload, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      setPreviewUrl(url)
    } catch (err) {
      toast.error('Preview failed')
    } finally {
      setLoading(false)
    }
  }

  const branding = useMemo(() => ({
    name: '', shortName: '', motto: '', affiliation: '', affiliationNumber: '', schoolCode: '',
    registrationNumber: '', udiseCode: '', board: '', academicSession: '', financialYear: '',
    ...data
  }), [data])

  const address = useMemo(() => ({ street: '', city: '', district: '', state: '', pincode: '', country: 'India', ...(data?.address || {}) }), [data])
  const contact = useMemo(() => ({ phone: '', alternatePhone: '', email: '', website: '', officePhone: '', officeEmail: '', ...(data?.contact || {}) }), [data])
  const officials = useMemo(() => ({ principalName: '', administratorName: '', officeContact: '', officeEmail: '', ...(data?.officials || {}) }), [data])
  const docSettings = useMemo(() => ({
    header: { showLogo: true, showName: true, showAddress: true, showContact: true, showWebsite: true, showEmail: true, alignment: 'center' },
    footer: { showMotto: false, showPoweredBy: true, customText: '', showQrCode: false, disclaimer: '', alignment: 'center' },
    watermark: { enabled: false, text: '' },
    ...(data?.documentSettings || {})
  }), [data])
  const autoNumbering = useMemo(() => data?.autoNumbering || {}, [data])
  const templates = useMemo(() => data?.documentTemplates || {}, [data])

  if (!data) return <div className="p-6 text-slate-500">Loading settings...</div>

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Building2 },
    { id: 'contact', label: 'Contact & Officials', icon: Phone },
    { id: 'documents', label: 'Document Settings', icon: FileText },
    { id: 'numbering', label: 'Auto Numbering', icon: Hash },
    { id: 'templates', label: 'Document Templates', icon: FileText },
    { id: 'preview', label: 'Preview', icon: Eye }
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configure" title="School Settings" description="Manage branding, numbering, and document templates" />

      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'branding' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">School Identity</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Input label="School Name" value={branding.name} onChange={(v) => setData({ ...data, name: v })} />
            <Input label="Short Name" value={branding.shortName} onChange={(v) => setData({ ...data, shortName: v })} />
            <Input label="Motto" value={branding.motto} onChange={(v) => setData({ ...data, motto: v })} />
            <Input label="Affiliation" value={branding.affiliation} onChange={(v) => setData({ ...data, affiliation: v })} />
            <Input label="Affiliation Number" value={branding.affiliationNumber} onChange={(v) => setData({ ...data, affiliationNumber: v })} />
            <Input label="School Code" value={branding.schoolCode} onChange={(v) => setData({ ...data, schoolCode: v })} />
            <Input label="Registration Number" value={branding.registrationNumber} onChange={(v) => setData({ ...data, registrationNumber: v })} />
            <Input label="UDISE Code" value={branding.udiseCode} onChange={(v) => setData({ ...data, udiseCode: v })} />
            <Input label="Board" value={branding.board} onChange={(v) => setData({ ...data, board: v })} />
            <Input label="Academic Session" value={branding.academicSession} onChange={(v) => setData({ ...data, academicSession: v })} />
            <Input label="Financial Year" value={branding.financialYear} onChange={(v) => setData({ ...data, financialYear: v })} />
          </div>
          <button onClick={() => updateSection('branding', { name: data.name, shortName: data.shortName, motto: data.motto, affiliation: data.affiliation, affiliationNumber: data.affiliationNumber, schoolCode: data.schoolCode, registrationNumber: data.registrationNumber, udiseCode: data.udiseCode, board: data.board, academicSession: data.academicSession, financialYear: data.financialYear }, 'branding')} disabled={loading} className="btn btn-primary">
            <Save className="h-4 w-4" /> Save Identity
          </button>

          <hr className="border-slate-200 dark:border-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Assets</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { field: 'logo', label: 'School Logo', current: data.logo },
              { field: 'favicon', label: 'Favicon', current: data.favicon },
              { field: 'assets.principalSignature', label: 'Principal Signature', current: data.assets?.principalSignature },
              { field: 'assets.schoolSeal', label: 'School Seal', current: data.assets?.schoolSeal },
              { field: 'assets.headerBackground', label: 'Header Background', current: data.assets?.headerBackground },
              { field: 'assets.footerImage', label: 'Footer Image', current: data.assets?.footerImage }
            ].map((asset) => (
              <div key={asset.field}>
                <label className="label">{asset.label}</label>
                {asset.current && <img src={asset.current} alt={asset.label} className="mb-2 h-16 w-auto rounded-lg" />}
                <input type="file" accept="image/*" onChange={(e) => handleAssetUpload(asset.field, e.target.files[0])} className="field" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Address</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(address).map(([key, value]) => (
              <Input key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={value} onChange={(v) => setData({ ...data, address: { ...address, [key]: v } })} />
            ))}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Contact</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(contact).map(([key, value]) => (
              <Input key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={value} onChange={(v) => setData({ ...data, contact: { ...contact, [key]: v } })} />
            ))}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Officials</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(officials).map(([key, value]) => (
              <Input key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={value} onChange={(v) => setData({ ...data, officials: { ...officials, [key]: v } })} />
            ))}
          </div>
          <button onClick={() => updateSection('branding', { address: data.address, contact: data.contact, officials: data.officials }, 'branding')} disabled={loading} className="btn btn-primary">
            <Save className="h-4 w-4" /> Save Contact & Officials
          </button>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Document Header</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(docSettings.header || {}).filter(([k]) => k !== 'alignment').map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={value} onChange={(e) => setData({ ...data, documentSettings: { ...docSettings, header: { ...docSettings.header, [key]: e.target.checked } } })} className="rounded border-slate-300" />
                {key.replace('show', 'Show ')}
              </label>
            ))}
          </div>
          <div>
            <label className="label">Header Alignment</label>
            <select value={docSettings.header.alignment} onChange={(e) => setData({ ...data, documentSettings: { ...docSettings, header: { ...docSettings.header, alignment: e.target.value } } })} className="field">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Document Footer</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(docSettings.footer || {}).filter(([k]) => !['customText', 'disclaimer', 'alignment'].includes(k)).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={value} onChange={(e) => setData({ ...data, documentSettings: { ...docSettings, footer: { ...docSettings.footer, [key]: e.target.checked } } })} className="rounded border-slate-300" />
                {key.replace('show', 'Show ')}
              </label>
            ))}
          </div>
          <Input label="Custom Footer Text" value={docSettings.footer.customText} onChange={(v) => setData({ ...data, documentSettings: { ...docSettings, footer: { ...docSettings.footer, customText: v } } })} />
          <Input label="Disclaimer" value={docSettings.footer.disclaimer} onChange={(v) => setData({ ...data, documentSettings: { ...docSettings, footer: { ...docSettings.footer, disclaimer: v } } })} />

          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Watermark</h3>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={docSettings.watermark.enabled} onChange={(e) => setData({ ...data, documentSettings: { ...docSettings, watermark: { ...docSettings.watermark, enabled: e.target.checked } } })} className="rounded border-slate-300" />
            Enable Watermark
          </label>
          <Input label="Watermark Text" value={docSettings.watermark.text} onChange={(v) => setData({ ...data, documentSettings: { ...docSettings, watermark: { ...docSettings.watermark, text: v } } })} />

          <button onClick={() => updateSection('document-settings', { documentSettings: data.documentSettings }, 'documentSettings')} disabled={loading} className="btn btn-primary">
            <Save className="h-4 w-4" /> Save Document Settings
          </button>
        </div>
      )}

      {activeTab === 'numbering' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Auto Numbering Rules</h3>
          <div className="space-y-4">
            {entityTypes.map(({ key, label }) => {
              const cfg = autoNumbering[key] || {}
              return (
                <div key={key} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">{label}</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Input label="Prefix" value={cfg.prefix} onChange={(v) => setData({ ...data, autoNumbering: { ...autoNumbering, [key]: { ...cfg, prefix: v } } })} />
                    <Input label="Length" value={cfg.numberLength} onChange={(v) => setData({ ...data, autoNumbering: { ...autoNumbering, [key]: { ...cfg, numberLength: Number(v) } } })} type="number" />
                    <Input label="Starting" value={cfg.startingNumber} onChange={(v) => setData({ ...data, autoNumbering: { ...autoNumbering, [key]: { ...cfg, startingNumber: Number(v) } } })} type="number" />
                    <Input label="Separator" value={cfg.separator} onChange={(v) => setData({ ...data, autoNumbering: { ...autoNumbering, [key]: { ...cfg, separator: v } } })} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {['includeAcademicYear', 'includeFinancialYear', 'includeSchoolCode', 'includeBranchCode'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <input type="checkbox" checked={cfg[opt]} onChange={(e) => setData({ ...data, autoNumbering: { ...autoNumbering, [key]: { ...cfg, [opt]: e.target.checked } } })} className="rounded border-slate-300" />
                        {opt.replace('include', 'Include ')}
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="label text-xs">Reset Policy</label>
                    <select value={cfg.resetPolicy} onChange={(e) => setData({ ...data, autoNumbering: { ...autoNumbering, [key]: { ...cfg, resetPolicy: e.target.value } } })} className="field text-sm">
                      <option value="academicYear">Academic Year</option>
                      <option value="financialYear">Financial Year</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => updateSection('auto-numbering', { autoNumbering: data.autoNumbering }, 'autoNumbering')} disabled={loading} className="btn btn-primary">
            <Save className="h-4 w-4" /> Save Numbering Rules
          </button>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Document Templates</h3>
          <div>
            <label className="label">Document Type</label>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="field">
              {documentTypes.map((t) => <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>)}
            </select>
          </div>
          {['header', 'footer', 'notes', 'body'].filter((k) => k !== 'body' || ['bonafideCertificate', 'characterCertificate', 'transferCertificate', 'appointmentLetter', 'experienceLetter', 'leavingCertificate'].includes(selectedTemplate)).map((field) => (
            <div key={field}>
              <label className="label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <textarea value={templates[selectedTemplate]?.[field] || ''} onChange={(e) => setData({ ...data, documentTemplates: { ...templates, [selectedTemplate]: { ...templates[selectedTemplate], [field]: e.target.value } } })} className="field min-h-[80px]" />
            </div>
          ))}
          <button onClick={() => updateSection('document-templates', { documentTemplates: data.documentTemplates }, 'documentTemplates')} disabled={loading} className="btn btn-primary">
            <Save className="h-4 w-4" /> Save Template
          </button>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Preview Document</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={previewType} onChange={(e) => setPreviewType(e.target.value)} className="field">
              {documentTypes.map((t) => <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>)}
            </select>
            <button onClick={handlePreview} disabled={loading} className="btn btn-primary whitespace-nowrap"><Eye className="h-4 w-4" /> Generate Preview</button>
          </div>
          {previewUrl && (
            <iframe src={previewUrl} title="Preview" className="h-[600px] w-full rounded-xl border border-slate-200 dark:border-slate-700" />
          )}
        </div>
      )}
    </div>
  )
}

export default SchoolSettings
