import { useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader } from '../../components/ui'
import { ChevronRight, ChevronLeft, User, Calendar, Check } from 'lucide-react'

const steps = ['School Details', 'Admin Account', 'Academic Session', 'Review']

const SchoolOnboarding = () => {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [result, setResult] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    phone: '',
    email: '',
    address: {
      street: '', city: '', state: '', pincode: '', country: 'India'
    },
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    sessionName: '',
    sessionCode: '',
    startDate: '',
    endDate: ''
  })

  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))
  const updateAddress = (key, value) => setFormData(prev => ({ ...prev, address: { ...prev.address, [key]: value } }))

  const canProceed = () => {
    if (step === 0) return formData.name && formData.email
    if (step === 1) return formData.adminName && formData.adminEmail && formData.adminPassword && formData.adminPassword === formData.confirmPassword
    if (step === 2) return formData.sessionName && formData.startDate && formData.endDate
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        name: formData.name,
        subdomain: formData.subdomain,
        address: formData.address,
        contact: { phone: formData.phone, email: formData.email },
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        session: {
          name: formData.sessionName,
          code: formData.sessionCode,
          startDate: formData.startDate,
          endDate: formData.endDate
        }
      }
      const res = await api.post('/schools/onboard', payload)
      setResult(res.data)
      setCompleted(true)
      toast.success('School onboarded successfully')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Onboarding failed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(0)
    setCompleted(false)
    setResult(null)
    setFormData({
      name: '', subdomain: '', phone: '', email: '',
      address: { street: '', city: '', state: '', pincode: '', country: 'India' },
      adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
      sessionName: '', sessionCode: '', startDate: '', endDate: ''
    })
  }

  if (completed && result) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Success" title="School Onboarded" />
        <div className="card space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{result.school.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tenant ID: <span className="font-mono text-slate-700 dark:text-slate-200">{result.school.tenantId}</span></p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Admin: <span className="font-medium text-slate-700 dark:text-slate-200">{result.admin.email}</span></p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Academic Session: <span className="font-medium text-slate-700 dark:text-slate-200">{result.academicSession.name}</span></p>
          <button onClick={reset} className="btn btn-primary">Onboard Another School</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Super Admin" title="School Onboarding Wizard" description="Create a new school tenant with admin and academic session" />

      <div className="card">
        <div className="mb-8 flex items-center justify-between">
          {steps.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${i <= step ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-400 dark:border-slate-700'}`}>
                {i < step ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              <p className={`mt-2 hidden text-xs font-medium sm:block ${i <= step ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{label}</p>
            </div>
          ))}
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); step === steps.length - 1 ? handleSubmit() : setStep(s => s + 1) }}>
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">School Name *</label>
                  <input value={formData.name} onChange={e => updateField('name', e.target.value)} className="field" placeholder="Rigveda Public School" required />
                </div>
                <div>
                  <label className="label">Subdomain</label>
                  <input value={formData.subdomain} onChange={e => updateField('subdomain', e.target.value)} className="field" placeholder="rigveda" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Email *</label>
                  <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="field" required />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="field" />
                </div>
              </div>
              <div>
                <label className="label">Street Address</label>
                <input value={formData.address.street} onChange={e => updateAddress('street', e.target.value)} className="field" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <input value={formData.address.city} onChange={e => updateAddress('city', e.target.value)} className="field" placeholder="City" />
                <input value={formData.address.state} onChange={e => updateAddress('state', e.target.value)} className="field" placeholder="State" />
                <input value={formData.address.pincode} onChange={e => updateAddress('pincode', e.target.value)} className="field" placeholder="Pincode" />
                <input value={formData.address.country} onChange={e => updateAddress('country', e.target.value)} className="field" placeholder="Country" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                <User className="h-5 w-5" />
                <p className="text-sm font-medium">Create the school administrator account</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Admin Name *</label>
                  <input value={formData.adminName} onChange={e => updateField('adminName', e.target.value)} className="field" required />
                </div>
                <div>
                  <label className="label">Admin Email *</label>
                  <input type="email" value={formData.adminEmail} onChange={e => updateField('adminEmail', e.target.value)} className="field" required />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Password *</label>
                  <input type="password" value={formData.adminPassword} onChange={e => updateField('adminPassword', e.target.value)} className="field" required />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <input type="password" value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} className="field" required />
                </div>
              </div>
              {formData.adminPassword && formData.confirmPassword && formData.adminPassword !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Calendar className="h-5 w-5" />
                <p className="text-sm font-medium">Set the first academic session</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Session Name *</label>
                  <input value={formData.sessionName} onChange={e => updateField('sessionName', e.target.value)} className="field" placeholder="2024-25" required />
                </div>
                <div>
                  <label className="label">Session Code *</label>
                  <input value={formData.sessionCode} onChange={e => updateField('sessionCode', e.target.value)} className="field" placeholder="2024-2025" required />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Start Date *</label>
                  <input type="date" value={formData.startDate} onChange={e => updateField('startDate', e.target.value)} className="field" required />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input type="date" value={formData.endDate} onChange={e => updateField('endDate', e.target.value)} className="field" required />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Review Details</h3>
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <p className="text-slate-500 dark:text-slate-400"><span className="font-medium text-slate-700 dark:text-slate-200">School:</span> {formData.name}</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="font-medium text-slate-700 dark:text-slate-200">Admin:</span> {formData.adminEmail}</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="font-medium text-slate-700 dark:text-slate-200">Session:</span> {formData.sessionName}</p>
                <p className="text-slate-500 dark:text-slate-400"><span className="font-medium text-slate-700 dark:text-slate-200">Period:</span> {formData.startDate} to {formData.endDate}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="btn btn-secondary gap-2 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button type="submit" disabled={!canProceed() || loading} className="btn btn-primary gap-2">
              {step === steps.length - 1 ? (loading ? 'Creating...' : 'Onboard School') : 'Next'} {step !== steps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SchoolOnboarding
