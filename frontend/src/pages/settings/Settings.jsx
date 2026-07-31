import { useState } from 'react'
import api from '../../utils/api'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { Palette, Image, Layout, Shield, ScrollText, Calendar, Building2 } from 'lucide-react'
import CustomFieldsManager from '../../components/CustomFieldsManager'
import { PageHeader } from '../../components/ui'
import RolesPermissions from './RolesPermissions'
import AuditLogs from './AuditLogs'
import AcademicSessions from './AcademicSessions'
import SchoolSettings from './SchoolSettings'

const Settings = () => {
  const { theme, logo } = useTheme()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('school')
  const [formData, setFormData] = useState({
    primaryColor: theme?.primaryColor || '#4f46e5',
    secondaryColor: theme?.secondaryColor || '#4338ca',
    accentColor: theme?.accentColor || '#f59e0b',
  })

  const handleThemeUpdate = async () => {
    setLoading(true)
    try { await api.put('/customization/theme', formData); toast.success('Theme updated'); window.location.reload() } catch (error) { toast.error('Failed to update theme') } finally { setLoading(false) }
  }

const tabs = [
    { id: 'school', label: 'School', icon: Building2 },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'logo', label: 'Logo', icon: Image },
    { id: 'customFields', label: 'Custom Fields', icon: Layout },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'academicSessions', label: 'Academic Sessions', icon: Calendar },
    { id: 'auditLogs', label: 'Audit Logs', icon: ScrollText },
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configure" title="Settings" description="Customize your school workspace" />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'school' && <SchoolSettings />}

      {activeTab === 'theme' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6"><Palette className="h-5 w-5 text-indigo-600" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Theme Colors</h3></div>
          <div className="space-y-4">
            {[{ label: 'Primary Color', key: 'primaryColor' }, { label: 'Secondary Color', key: 'secondaryColor' }, { label: 'Accent Color', key: 'accentColor' }].map((item) => (
              <div key={item.key}>
                <label className="label">{item.label}</label>
                <div className="flex gap-2"><input type="color" value={formData[item.key]} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })} className="h-10 w-16 cursor-pointer rounded-xl border border-slate-200" /><input type="text" value={formData[item.key]} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })} className="field flex-1" /></div>
              </div>
            ))}
            <button onClick={handleThemeUpdate} disabled={loading} className="btn btn-primary w-full">{loading ? 'Saving...' : 'Save Theme'}</button>
          </div>
        </div>
      )}

      {activeTab === 'logo' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6"><Image className="h-5 w-5 text-indigo-600" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">School Logo</h3></div>
          <div className="space-y-4">
            {logo && <img src={logo} alt="School Logo" className="h-20 w-auto rounded-xl" />}
            <div><label className="label">Upload Logo</label><input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if (file) { const fd = new FormData(); fd.append('logo', file); try { await api.post('/customization/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Logo uploaded'); window.location.reload() } catch (error) { toast.error('Failed to upload logo') } } }} className="field" /></div>
          </div>
        </div>
      )}

      {activeTab === 'customFields' && <CustomFieldsManager />}
      {activeTab === 'roles' && <RolesPermissions />}
      {activeTab === 'academicSessions' && <AcademicSessions />}
      {activeTab === 'auditLogs' && <AuditLogs />}
    </div>
  )
}

export default Settings
