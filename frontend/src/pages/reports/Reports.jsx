import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { Download, BarChart3, Users, DollarSign, Calendar, GraduationCap } from 'lucide-react'

const Reports = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/dashboard')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (type) => {
    try {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/export/${type}`, '_blank')
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and export reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Students</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.students || 0}</p>
          <button onClick={() => exportReport('students')} className="mt-4 btn btn-secondary w-full text-sm">
            <Download className="w-4 h-4 mr-2 inline" /> Export CSV
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Teachers</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.teachers || 0}</p>
          <button onClick={() => exportReport('teachers')} className="mt-4 btn btn-secondary w-full text-sm">
            <Download className="w-4 h-4 mr-2 inline" /> Export CSV
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Attendance</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.attendance?.percentage || 0}%</p>
          <button className="mt-4 btn btn-secondary w-full text-sm">View Report</button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Fees</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(stats?.fees?.collected || 0).toLocaleString()}</p>
          <button onClick={() => exportReport('fees')} className="mt-4 btn btn-secondary w-full text-sm">
            <Download className="w-4 h-4 mr-2 inline" /> Export CSV
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <BarChart3 className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">Attendance Report</h4>
            <p className="text-sm text-gray-500">View detailed attendance statistics</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <DollarSign className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">Fee Collection Report</h4>
            <p className="text-sm text-gray-500">Track fee collection status</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <Users className="w-6 h-6 text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">Student Strength Report</h4>
            <p className="text-sm text-gray-500">Class-wise student distribution</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports
