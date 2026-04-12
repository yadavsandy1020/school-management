import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useTheme } from '../contexts/ThemeContext'
import ModernDashboard from '../components/templates/ModernDashboard'
import MinimalistDashboard from '../components/templates/MinimalistDashboard'
import WidgetDashboard from '../components/templates/WidgetDashboard'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/reports/dashboard')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const template = theme?.template || 'modern'

  const renderTemplate = () => {
    switch (template) {
      case 'minimalist':
        return <MinimalistDashboard stats={stats} />
      case 'widget':
        return <WidgetDashboard stats={stats} />
      default:
        return <ModernDashboard stats={stats} />
    }
  }

  return renderTemplate()
}

export default Dashboard
