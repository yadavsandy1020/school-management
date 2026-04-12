import { Users, GraduationCap, BookOpen, DollarSign, Calendar } from 'lucide-react'

const MinimalistDashboard = ({ stats }) => {
  return (
    <div className="space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Students</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats?.students || 0}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Teachers</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats?.teachers || 0}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Classes</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats?.classes || 0}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Fees</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">₹{(stats?.fees?.collected || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Attendance</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Present</span>
              <span className="font-medium">{stats?.attendance?.present || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Absent</span>
              <span className="font-medium">{stats?.attendance?.absent || 0}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600 font-medium">Rate</span>
              <span className="font-semibold">{stats?.attendance?.percentage || 0}%</span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Fees</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Collected</span>
              <span className="font-medium">₹{(stats?.fees?.collected || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium">₹{(stats?.fees?.pending || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600 font-medium">Rate</span>
              <span className="font-semibold">{stats?.fees?.collectionRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MinimalistDashboard
