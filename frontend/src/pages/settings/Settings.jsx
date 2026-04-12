import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { Palette, Image, Settings as SettingsIcon, Layout } from 'lucide-react'
import CustomFieldsManager from '../../components/CustomFieldsManager'

const Settings = () => {
  const { theme, logo } = useTheme()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('theme')
  const [formData, setFormData] = useState({
    primaryColor: theme?.primaryColor || '#3b82f6',
    secondaryColor: theme?.secondaryColor || '#1e40af',
    accentColor: theme?.accentColor || '#f59e0b',
  })

  const handleThemeUpdate = async () => {
    setLoading(true)
    try {
      await api.put('/customization/theme', formData)
      toast.success('Theme updated successfully')
      window.location.reload()
    } catch (error) {
      toast.error('Failed to update theme')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'logo', label: 'Logo', icon: Image },
    { id: 'customFields', label: 'Custom Fields', icon: Layout },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Customize your school's appearance and settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'theme' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Theme Colors</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>

            <div>
              <label className="label">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>

            <div>
              <label className="label">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>

            <button
              onClick={handleThemeUpdate}
              disabled={loading}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Theme'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'logo' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Image className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">School Logo</h3>
          </div>

          <div className="space-y-4">
            {logo && (
              <div className="mb-4">
                <img src={logo} alt="School Logo" className="h-20 w-auto" />
              </div>
            )}
            <div>
              <label className="label">Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (file) {
                    const formData = new FormData()
                    formData.append('logo', file)
                    try {
                      await api.post('/customization/logo', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      })
                      toast.success('Logo uploaded successfully')
                      window.location.reload()
                    } catch (error) {
                      toast.error('Failed to upload logo')
                    }
                  }
                }}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customFields' && (
        <CustomFieldsManager />
      )}
    </div>
  )
}

export default Settings
