import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import { Search, ToggleLeft, ToggleRight } from 'lucide-react'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => { fetchUsers(); fetchRoles() }, [])

  const fetchUsers = async () => {
    try {
      const params = {}
      if (roleFilter) params.role = roleFilter
      const res = await api.get('/users', { params })
      setUsers(res.data.users)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles')
      setRoles(res.data.data)
    } catch (error) {
      console.error('Failed to load roles')
    }
  }

  const handleRoleChange = async (userId, roleId) => {
    try {
      await api.put(`/users/${userId}`, { roleId })
      toast.success('Role updated')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  const handleStatusToggle = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !isActive })
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <div className="card"><Skeleton className="h-64" /></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="User Management"
        description="Manage users, roles, and account status"
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center dark:border-slate-800">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="field h-10 pl-9" />
          </label>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setTimeout(fetchUsers, 0) }} className="field h-10 sm:w-40">
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="school_admin">School Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-6"><EmptyState title="No users found" description="Try adjusting filters or create users through admissions" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                          {user.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <select
                        value={user.roleId?._id || ''}
                        onChange={e => handleRoleChange(user._id, e.target.value)}
                        className="field h-9 w-full min-w-[140px] py-1 text-xs"
                      >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <button onClick={() => handleStatusToggle(user._id, user.isActive)} className="icon-button h-8 w-8" title={user.isActive ? 'Deactivate user' : 'Activate user'}>
                        {user.isActive ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement
