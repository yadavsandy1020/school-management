import { Users, GraduationCap, BookOpen, DollarSign, Calendar, TrendingUp, Activity } from 'lucide-react'

const WidgetDashboard = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg text-white">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-primary-100 mt-1">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+12%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{stats?.students || 0}</p>
          <p className="text-gray-600 mt-1">Total Students</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-green-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+5%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{stats?.teachers || 0}</p>
          <p className="text-gray-600 mt-1">Total Teachers</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+2%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{stats?.classes || 0}</p>
          <p className="text-gray-600 mt-1">Total Classes</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">{stats?.fees?.collectionRate || 0}%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">₹{(stats?.fees?.collected || 0).toLocaleString()}</p>
          <p className="text-gray-600 mt-1">Fees Collected</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-red-100 rounded-lg">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Daily</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{stats?.attendance?.percentage || 0}%</p>
          <p className="text-gray-600 mt-1">Attendance Rate</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Active</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{stats?.attendance?.present || 0}</p>
          <p className="text-gray-600 mt-1">Present Today</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.attendance?.total || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total Students</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.attendance?.present || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Present</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{stats?.attendance?.absent || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Absent</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">₹{(stats?.fees?.pending || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Pending Fees</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WidgetDashboard
