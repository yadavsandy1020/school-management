import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Shield, Plus, Pencil, Trash2, X, Check, Lock } from 'lucide-react'

const RolesPermissions = () => {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', permissionCodes: [] })

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles')
      setRoles(res.data.data)
    } catch (error) {
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/roles/permissions')
      setPermissions(res.data.data)
    } catch (error) {
      console.error('Failed to load permissions')
    }
  }

  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  const openCreate = () => {
    setEditingRole(null)
    setFormData({ name: '', slug: '', description: '', permissionCodes: [] })
    setShowModal(true)
  }

  const openEdit = (role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissionCodes: role.permissionCodes || []
    })
    setShowModal(true)
  }

  const togglePermission = (code) => {
    setFormData(prev => ({
      ...prev,
      permissionCodes: prev.permissionCodes.includes(code)
        ? prev.permissionCodes.filter(c => c !== code)
        : [...prev.permissionCodes, code]
    }))
  }

  const toggleCategory = (category) => {
    const categoryCodes = groupedPermissions[category].map(p => p.code)
    const allSelected = categoryCodes.every(c => formData.permissionCodes.includes(c))
    setFormData(prev => ({
      ...prev,
      permissionCodes: allSelected
        ? prev.permissionCodes.filter(c => !categoryCodes.includes(c))
        : [...new Set([...prev.permissionCodes, ...categoryCodes])]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole._id}`, formData)
        toast.success('Role updated')
      } else {
        await api.post('/roles', formData)
        toast.success('Role created')
      }
      setShowModal(false)
      fetchRoles()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save role')
    }
  }

  const handleDelete = async (roleId) => {
    if (!confirm('Deactivate this role? Users assigned to it will lose access.')) return
    try {
      await api.delete(`/roles/${roleId}`)
      toast.success('Role deactivated')
      fetchRoles()
    } catch (error) {
      toast.error('Failed to deactivate role')
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Roles & Permissions"
        description="Manage user roles and their access permissions"
        actions={
          <Can permission="ROLE_MANAGE">
            <button onClick={openCreate} className="btn btn-primary gap-2">
              <Plus className="h-4 w-4" /> New Role
            </button>
          </Can>
        }
      />

      {roles.length === 0 ? (
        <EmptyState title="No roles found" description="Create your first custom role to get started" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(role => (
            <div key={role._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{role.name}</p>
                    <p className="text-xs text-slate-400">{role.slug}</p>
                  </div>
                </div>
                {role.isSystem && <Lock className="h-4 w-4 text-slate-300" />}
              </div>
              {role.description && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{role.description}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(role.permissionCodes || []).slice(0, 5).map(code => (
                  <span key={code} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{code}</span>
                ))}
                {(role.permissionCodes || []).length > 5 && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">+{(role.permissionCodes || []).length - 5} more</span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Can permission="ROLE_MANAGE" fallback={
                  <span className="text-xs text-slate-400">{(role.permissionCodes || []).length} permissions</span>
                }>
                  {!role.isSystem && (
                    <>
                      <button onClick={() => openEdit(role)} className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(role._id)} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3" /> Deactivate
                      </button>
                    </>
                  )}
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{editingRole ? 'Edit Role' : 'New Role'}</h2>
              <button onClick={() => setShowModal(false)} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Role Name</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" placeholder="e.g. Librarian" required />
                </div>
                <div>
                  <label className="label">Slug</label>
                  <input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="field" placeholder="e.g. librarian" required />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="field" placeholder="Optional description" />
              </div>
              <div>
                <p className="label">Permissions</p>
                <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  {Object.entries(groupedPermissions).map(([category, perms]) => {
                    const allSelected = perms.every(p => formData.permissionCodes.includes(p.code))
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleCategory(category)} className="flex items-center gap-2 text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">
                            <span className={`flex h-4 w-4 items-center justify-center rounded ${allSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-600'}`}>
                              {allSelected && <Check className="h-3 w-3" />}
                            </span>
                            {category}
                          </button>
                        </div>
                        <div className="mt-2 ml-6 flex flex-wrap gap-2">
                          {perms.map(p => (
                            <button key={p.code} type="button" onClick={() => togglePermission(p.code)} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${formData.permissionCodes.includes(p.code) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingRole ? 'Update Role' : 'Create Role'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RolesPermissions
