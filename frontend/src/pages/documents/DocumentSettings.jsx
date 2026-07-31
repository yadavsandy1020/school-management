import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Save, Eye, FileText, Printer, Shield, Stamp, Palette } from 'lucide-react'
import api from '../../utils/api'
import Can from '../../components/Can'
import { PageHeader, LoadingState, SelectField, InputField, Checkbox } from '../../components/ui'

const DOCUMENT_TYPES = [
  { key: 'feeReceipt', label: 'Fee Receipt' },
  { key: 'feeInvoice', label: 'Fee Invoice' },
  { key: 'reportCard', label: 'Report Card' },
  { key: 'transferCertificate', label: 'Transfer Certificate' },
  { key: 'bonafideCertificate', label: 'Bonafide Certificate' },
  { key: 'studentIdCard', label: 'Student ID Card' },
  { key: 'employeeIdCard', label: 'Employee ID Card' },
  { key: 'admitCard', label: 'Admit Card' },
  { key: 'salarySlip', label: 'Salary Slip' },
  { key: 'notice', label: 'Notice / Circular' },
  { key: 'report', label: 'Generic Report' },
]

const TABS = [
  { key: 'template', label: 'Template Selection', icon: Palette },
  { key: 'header', label: 'Header', icon: FileText },
  { key: 'footer', label: 'Footer', icon: FileText },
  { key: 'signatures', label: 'Signatures & Seal', icon: Stamp },
  { key: 'printing', label: 'Printing', icon: Printer },
  { key: 'verification', label: 'Verification', icon: Shield },
]

export default function DocumentSettings() {
  const [activeTab, setActiveTab] = useState('template')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState('feeReceipt')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/documents/settings')
      if (data.success) setSettings(data.documentSettings)
    } catch (err) {
      toast.error('Failed to load document settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/documents/settings', { documentSettings: settings })
      if (data.success) {
        setSettings(data.documentSettings)
        toast.success('Document settings saved')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    try {
      const response = await api.post('/customization/preview/' + previewType, {}, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      setPreviewUrl(url)
    } catch (err) {
      toast.error('Preview failed — try generating a document instead')
    }
  }

  const update = (path, value) => {
    setSettings(prev => {
      const next = { ...prev }
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] }
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return next
    })
  }

  if (loading) return <LoadingState message="Loading document settings..." />
  if (!settings) return <div className="text-sm text-slate-500">No settings found.</div>

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Documents"
        title="Document Settings"
        description="Configure templates, header, footer, signatures, printing, and verification"
        actions={
          <div className="flex gap-2">
            <select value={previewType} onChange={e => setPreviewType(e.target.value)} className="field h-10 w-40">
              {DOCUMENT_TYPES.map(dt => <option key={dt.key} value={dt.key}>{dt.label}</option>)}
            </select>
            <button onClick={handlePreview} className="btn btn-secondary gap-2">
              <Eye className="h-4 w-4" /> Preview
            </button>
            <Can permission="DOCUMENTS_TEMPLATE_MANAGE">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
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

      {/* ─── Template Selection Tab ─── */}
      {activeTab === 'template' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Template Style</h3>
          <p className="mt-1 text-xs text-slate-500">Choose the default template style for all documents. You can override per document type below.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div
              onClick={() => update('defaultTemplate', 'standard')}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${settings.defaultTemplate === 'standard' ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800'}`}
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">Standard</p>
              <p className="mt-1 text-xs text-slate-500">Formal, compact, printer-friendly. Clean lines and traditional layout.</p>
            </div>
            <div
              onClick={() => update('defaultTemplate', 'modern')}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${settings.defaultTemplate === 'modern' ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800'}`}
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">Modern</p>
              <p className="mt-1 text-xs text-slate-500">Clean, premium, visually polished. Accent bars and alternating rows.</p>
            </div>
          </div>

          <h4 className="mt-6 text-sm font-semibold text-slate-900 dark:text-white">Per-Document Overrides</h4>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOCUMENT_TYPES.map(dt => (
              <SelectField
                key={dt.key}
                label={dt.label}
                value={settings.templateOverrides?.[dt.key] || ''}
                onChange={e => update(`templateOverrides.${dt.key}`, e.target.value)}
                options={[
                  { value: '', label: 'Use Default' },
                  { value: 'standard', label: 'Standard' },
                  { value: 'modern', label: 'Modern' },
                ]}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Header Tab ─── */}
      {activeTab === 'header' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Document Header</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectField label="Header Style" value={settings.header?.style || 'standard'} onChange={e => update('header.style', e.target.value)}
              options={[{ value: 'standard', label: 'Standard' }, { value: 'compact', label: 'Compact' }, { value: 'modern', label: 'Modern' }, { value: 'none', label: 'None' }]} />
            <SelectField label="Alignment" value={settings.header?.alignment || 'center'} onChange={e => update('header.alignment', e.target.value)}
              options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ['showLogo', 'School Logo'], ['showName', 'School Name'], ['showShortName', 'Short Name'],
              ['showMotto', 'Motto'], ['showBoard', 'Board'], ['showAffiliationNumber', 'Affiliation No.'],
              ['showSchoolCode', 'School Code'], ['showUdiseCode', 'UDISE Code'],
              ['showRegistrationNumber', 'Registration No.'], ['showAddress', 'Address'],
              ['showContact', 'Phone'], ['showWebsite', 'Website'], ['showEmail', 'Email'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
                <Checkbox checked={settings.header?.[key] ?? false} onChange={e => update(`header.${key}`, e.target.checked)} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ─── Footer Tab ─── */}
      {activeTab === 'footer' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Document Footer</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectField label="Footer Style" value={settings.footer?.style || 'standard'} onChange={e => update('footer.style', e.target.value)}
              options={[{ value: 'standard', label: 'Standard' }, { value: 'compact', label: 'Compact' }, { value: 'modern', label: 'Modern' }, { value: 'none', label: 'None' }]} />
            <SelectField label="Alignment" value={settings.footer?.alignment || 'center'} onChange={e => update('footer.alignment', e.target.value)}
              options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
          </div>
          <div className="mt-4 grid gap-4">
            <InputField label="Custom Text" value={settings.footer?.customText || ''} onChange={e => update('footer.customText', e.target.value)} placeholder="e.g. This is a computer-generated document." />
            <InputField label="Disclaimer" value={settings.footer?.disclaimer || ''} onChange={e => update('footer.disclaimer', e.target.value)} placeholder="e.g. This document is valid only with authorized signature." />
            <InputField label="Computer Generated Text" value={settings.footer?.computerGeneratedText || ''} onChange={e => update('footer.computerGeneratedText', e.target.value)} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ['showMotto', 'Show Motto'], ['showPoweredBy', 'Powered By'], ['showContact', 'Show Contact'],
              ['showWebsite', 'Show Website'], ['showPageNumber', 'Page Number'],
              ['showGeneratedDate', 'Generated Date'], ['showGeneratedBy', 'Generated By'],
              ['showQrCode', 'QR Code in Footer'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
                <Checkbox checked={settings.footer?.[key] ?? false} onChange={e => update(`footer.${key}`, e.target.checked)} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ─── Signatures & Seal Tab ─── */}
      {activeTab === 'signatures' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Signatures</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {['principal', 'accountant', 'classTeacher', 'authorizedSignatory'].map(role => (
                <div key={role} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={settings.signatures?.[role]?.show ?? false} onChange={e => update(`signatures.${role}.show`, e.target.checked)} />
                    <span className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{role.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                  <div className="mt-3 grid gap-3">
                    <InputField label="Name" value={settings.signatures?.[role]?.name || ''} onChange={e => update(`signatures.${role}.name`, e.target.value)} placeholder="Full name" />
                    <InputField label="Title" value={settings.signatures?.[role]?.title || ''} onChange={e => update(`signatures.${role}.title`, e.target.value)} placeholder="e.g. Principal" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">School Seal</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox checked={settings.seal?.show ?? false} onChange={e => update('seal.show', e.target.checked)} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show school seal on documents</span>
              </label>
              <SelectField label="Seal Position" value={settings.seal?.position || 'center'} onChange={e => update('seal.position', e.target.value)}
                options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Printing Tab ─── */}
      {activeTab === 'printing' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Printing Configuration</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField label="Paper Size" value={settings.printing?.paperSize || 'A4'} onChange={e => update('printing.paperSize', e.target.value)}
              options={[{ value: 'A4', label: 'A4' }, { value: 'A5', label: 'A5' }]} />
            <SelectField label="Orientation" value={settings.printing?.orientation || 'portrait'} onChange={e => update('printing.orientation', e.target.value)}
              options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
            <SelectField label="Receipt Size" value={settings.printing?.receiptSize || 'A5'} onChange={e => update('printing.receiptSize', e.target.value)}
              options={[{ value: 'A5', label: 'A5' }, { value: 'A4', label: 'A4' }, { value: 'halfA4', label: 'Half A4' }]} />
            <SelectField label="ID Card Layout" value={settings.printing?.idCardLayout || 'double'} onChange={e => update('printing.idCardLayout', e.target.value)}
              options={[{ value: 'single', label: 'Single Side' }, { value: 'double', label: 'Double Side (Front + Back)' }]} />
            <InputField label="Top Margin (pt)" type="number" value={settings.printing?.marginTop ?? 40} onChange={e => update('printing.marginTop', Number(e.target.value))} />
            <InputField label="Bottom Margin (pt)" type="number" value={settings.printing?.marginBottom ?? 40} onChange={e => update('printing.marginBottom', Number(e.target.value))} />
            <InputField label="Left Margin (pt)" type="number" value={settings.printing?.marginLeft ?? 40} onChange={e => update('printing.marginLeft', Number(e.target.value))} />
            <InputField label="Right Margin (pt)" type="number" value={settings.printing?.marginRight ?? 40} onChange={e => update('printing.marginRight', Number(e.target.value))} />
          </div>

          <h4 className="mt-6 text-sm font-semibold text-slate-900 dark:text-white">Watermark</h4>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox checked={settings.watermark?.enabled ?? false} onChange={e => update('watermark.enabled', e.target.checked)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable watermark</span>
            </label>
            <InputField label="Watermark Text" value={settings.watermark?.text || ''} onChange={e => update('watermark.text', e.target.value)} placeholder="e.g. SCHOOL NAME" />
          </div>
        </div>
      )}

      {/* ─── Verification Tab ─── */}
      {activeTab === 'verification' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Document Verification</h3>
          <p className="mt-1 text-xs text-slate-500">Enable QR code verification for documents. Each generated document will have a unique QR code linking to a public verification page.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox checked={settings.verification?.qrEnabled ?? false} onChange={e => update('verification.qrEnabled', e.target.checked)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable QR Code Verification</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox checked={settings.verification?.documentNumbering ?? true} onChange={e => update('verification.documentNumbering', e.target.checked)} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Auto Document Numbering</span>
            </label>
          </div>

          <div className="mt-4">
            <InputField label="Verification URL" value={settings.verification?.verificationUrl || ''} onChange={e => update('verification.verificationUrl', e.target.value)} placeholder="e.g. https://verify.edupilot.in" helper="Base URL for public document verification. QR codes will link to {verificationUrl}/{token}" />
          </div>
        </div>
      )}

      {/* ─── Preview Modal ─── */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="fixed inset-0 bg-slate-950/50" onClick={() => { setPreviewUrl(''); URL.revokeObjectURL(previewUrl) }} />
          <div className="relative z-10 h-[90vh] w-full max-w-4xl rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold">Document Preview</h3>
              <button onClick={() => { setPreviewUrl(''); URL.revokeObjectURL(previewUrl) }} className="btn btn-secondary h-8 px-3 text-xs">Close</button>
            </div>
            <iframe src={previewUrl} className="h-[calc(90vh-60px)] w-full rounded-b-2xl" title="Preview" />
          </div>
        </div>
      )}
    </div>
  )
}
