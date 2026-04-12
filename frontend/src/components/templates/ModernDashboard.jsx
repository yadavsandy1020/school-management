import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, Calendar } from 'lucide-react'

const ModernDashboard = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Students',
      value: stats?.students || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
    },
    {
      title: 'Total Teachers',
      value: stats?.teachers || 0,
      icon: GraduationCap,
      color: 'bg-green-500',
      trend: '+5%',
    },
    {
      title: 'Total Classes',
      value: stats?.classes || 0,
      icon: BookOpen,
      color: 'bg-purple-500',
      trend: '+2%',
    },
    {
      title: 'Fee Collection',
      value: `₹${(stats?.fees?.collected || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      trend: `${stats?.fees?.collectionRate || 0}%`,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your school management dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stat.trend}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
            <Calendar className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Students</span>
              <span className="font-semibold">{stats?.attendance?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Present</span>
              <span className="font-semibold text-green-600">{stats?.attendance?.present || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Absent</span>
              <span className="font-semibold text-red-600">{stats?.attendance?.absent || 0}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Attendance Rate</span>
                <span className="text-2xl font-bold text-primary-600">
                  {stats?.attendance?.percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats?.attendance?.percentage || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Fee Collection</h3>
            <DollarSign className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Fees</span>
              <span className="font-semibold">₹{(stats?.fees?.total || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Collected</span>
              <span className="font-semibold text-green-600">₹{(stats?.fees?.collected || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-red-600">₹{(stats?.fees?.pending || 0).toLocaleString()}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Collection Rate</span>
                <span className="text-2xl font-bold text-primary-600">
                  {stats?.fees?.collectionRate || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats?.fees?.collectionRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernDashboard
