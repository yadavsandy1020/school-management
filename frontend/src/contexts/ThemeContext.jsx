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
      const schoolTheme = response.data.school.theme
      const schoolLogo = response.data.school.logo

      setTheme(schoolTheme)
      setLogo(schoolLogo)

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
