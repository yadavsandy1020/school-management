import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
  })
  const [logo, setLogo] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [schoolShortName, setSchoolShortName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tenantId = localStorage.getItem('tenantId')
    if (tenantId) {
      fetchTheme(tenantId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchTheme = async (tenantId) => {
    try {
      const response = await api.get(`/schools/tenant/${tenantId}`)
      const school = response.data.school
      const schoolTheme = school.theme
      const schoolLogo = school.logo

      setTheme(schoolTheme)
      setLogo(schoolLogo)
      setSchoolName(school.name || '')
      setSchoolShortName(school.shortName || '')

      // Apply theme colors to CSS variables
      document.documentElement.style.setProperty('--primary-color', schoolTheme.primaryColor)
      document.documentElement.style.setProperty('--secondary-color', schoolTheme.secondaryColor)
      document.documentElement.style.setProperty('--accent-color', schoolTheme.accentColor)
      document.documentElement.style.setProperty('--font-family', schoolTheme.fontFamily)
    } catch (error) {
      console.error('Failed to fetch theme:', error)
      // Don't break the app if theme fetch fails
    } finally {
      setLoading(false)
    }
  }

  const value = {
    theme,
    logo,
    schoolName,
    schoolShortName,
    loading,
    fetchTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
