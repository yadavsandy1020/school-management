import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { CreditCard, Building2, Check, X, Calendar, TrendingUp, AlertCircle, Search, Zap, Boxes, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../utils/api'
import { PageHeader, LoadingState, Badge, SelectField, InputField, Checkbox } from '../../components/ui'

const TABS = [
  { key: 'overview', label: 'Overview', icon: TrendingUp },
  { key: 'schools', label: 'Schools', icon: Building2 },
  { key: 'plans', label: 'Plans & Pricing', icon: CreditCard },
  { key: 'modules', label: 'Modules', icon: Boxes },
]

const PLAN_ICONS = {
  free: { color: 'text-slate-600 bg-slate-100 dark:bg-slate-800', label: 'Free' },
  basic: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10', label: 'Basic' },
  premium: { color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10', label: 'Premium' },
  enterprise: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10', label: 'Enterprise' },
}

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [plans, setPlans] = useState([])
  const [search, setSearch] = useState('')
  const [assignModal, setAssignModal] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [modules, setModules] = useState([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [togglingModule, setTogglingModule] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/saas/analytics/super-admin')
      if (data.success) setAnalytics(data.analytics)
    } catch (err) {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await api.get('/saas/plans')
      if (data.success) setPlans(data.plans)
    } catch (err) {
      toast.error('Failed to load plans')
    }
  }, [])

  const fetchModules = useCallback(async (tenantId) => {
    setModulesLoading(true)
    try {
      const { data } = await api.get(`/saas/feature-flags/${tenantId}`)
      if (data.success) setModules(data.features)
    } catch (err) {
      toast.error('Failed to load modules')
    } finally {
      setModulesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    fetchPlans()
  }, [fetchAnalytics, fetchPlans])

  useEffect(() => {
    if (activeTab === 'modules' && analytics?.schools?.length && !selectedTenant) {
      setSelectedTenant(analytics.schools[0].tenantId)
    }
    if (activeTab === 'modules' && selectedTenant) {
      fetchModules(selectedTenant)
    }
  }, [activeTab, analytics, selectedTenant, fetchModules])

  const handleToggleModule = async (featureCode, currentStatus) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled'
    setTogglingModule(featureCode)
    try {
      const { data } = await api.put(`/saas/feature-flags/${selectedTenant}/${featureCode}`, { status: newStatus })
      if (data.success) {
        setModules(prev => prev.map(m => m.code === featureCode ? { ...m, status: newStatus, source: 'manual' } : m))
        toast.success(`${featureCode} ${newStatus === 'enabled' ? 'enabled' : 'disabled'}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update module')
    } finally {
      setTogglingModule(null)
    }
  }

  const handleAssignPlan = async () => {
    if (!assignModal?.planCode) {
      toast.error('Select a plan')
      return
    }
    setAssigning(true)
    try {
      const body = {
        planCode: assignModal.planCode,
        billingCycle: assignModal.billingCycle || 'yearly',
        validUntil: assignModal.validUntil || undefined,
        trial: assignModal.trial || false,
        agreedPrice: assignModal.agreedPrice || undefined,
        finalPrice: assignModal.finalPrice || undefined,
      }
      const { data } = await api.post(`/saas/schools/${assignModal.tenantId}/assign-plan`, body)
      if (data.success) {
        toast.success(data.message || 'Plan assigned successfully')
        setAssignModal(null)
        fetchAnalytics()
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign plan')
    } finally {
      setAssigning(false)
    }
  }

  const filteredSchools = (analytics?.schools || []).filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.tenantId?.toLowerCase().includes(search.toLowerCase())
  )

  const getPlanBadge = (plan) => {
    const p = PLAN_ICONS[plan] || PLAN_ICONS.free
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${p.color}`}>{p.label}</span>
  }

  if (loading) return <LoadingState message="Loading subscription data..." />

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Subscription Management"
        description="Manage school subscriptions, plans, and pricing"
      />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'gradient-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Schools" value={analytics.totalSchools} icon={Building2} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" />
            <StatCard label="Active Subscriptions" value={analytics.activeSubscriptions} icon={Check} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" />
            <StatCard label="Expired Licenses" value={analytics.expiredLicenses} icon={AlertCircle} color="text-red-600 bg-red-50 dark:bg-red-500/10" />
            <StatCard label="Pending Renewals" value={analytics.pendingRenewals} icon={Calendar} color="text-amber-600 bg-amber-50 dark:bg-amber-500/10" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">School Status Summary</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>School</th><th>Tenant ID</th><th>Plan</th><th>Active</th><th>Expired</th><th>License Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredSchools.map(s => (
                    <tr key={s.tenantId}>
                      <td className="font-medium">{s.name}</td>
                      <td className="text-xs text-slate-500">{s.tenantId}</td>
                      <td>{getPlanBadge(s.plan)}</td>
                      <td>{s.isActive ? <Badge variant="success">Yes</Badge> : <Badge variant="danger">No</Badge>}</td>
                      <td>{s.isExpired ? <Badge variant="danger">Expired</Badge> : <Badge variant="success">Valid</Badge>}</td>
                      <td>
                        <div className="flex gap-1">
                          {s.licenseStatus?.active && <Badge variant="success">Active</Badge>}
                          {s.licenseStatus?.suspended && <Badge variant="warning">Suspended</Badge>}
                          {s.licenseStatus?.expired && <Badge variant="danger">Expired</Badge>}
                          {s.licenseStatus?.trial && <Badge variant="info">Trial</Badge>}
                          {!s.licenseStatus?.active && !s.licenseStatus?.suspended && !s.licenseStatus?.expired && !s.licenseStatus?.trial && <Badge>No License</Badge>}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => setAssignModal({ tenantId: s.tenantId, schoolName: s.name, planCode: '', billingCycle: 'yearly', validUntil: '', trial: false, agreedPrice: '', finalPrice: '' })}
                          className="btn btn-secondary h-8 px-3 text-xs gap-1"
                        >
                          <Zap className="h-3 w-3" /> Assign Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Schools Tab ─── */}
      {activeTab === 'schools' && analytics && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by school name or tenant ID..." className="field h-10 pl-9" />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredSchools.map(s => (
              <div key={s.tenantId} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h3>
                    <p className="text-xs text-slate-500">{s.tenantId}</p>
                  </div>
                  {getPlanBadge(s.plan)}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-slate-500">Subscription</p>
                    <p className="mt-1 font-semibold">{s.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-slate-500">License</p>
                    <p className="mt-1 font-semibold capitalize">
                      {s.licenseStatus?.active ? 'Active' : s.licenseStatus?.suspended ? 'Suspended' : s.licenseStatus?.expired ? 'Expired' : s.licenseStatus?.trial ? 'Trial' : 'None'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-slate-500">Students</p>
                    <p className="mt-1 font-semibold">{s.usage?.studentCount ?? '-'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-slate-500">Teachers</p>
                    <p className="mt-1 font-semibold">{s.usage?.teacherCount ?? '-'}</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => { setSelectedTenant(s.tenantId); setActiveTab('modules') }}
                    className="btn btn-secondary h-9 px-4 text-xs gap-2"
                  >
                    <Boxes className="h-3.5 w-3.5" /> Modules
                  </button>
                  <button
                    onClick={() => setAssignModal({ tenantId: s.tenantId, schoolName: s.name, planCode: '', billingCycle: 'yearly', validUntil: '', trial: false, agreedPrice: '', finalPrice: '' })}
                    className="btn btn-primary h-9 px-4 text-xs gap-2"
                  >
                    <Zap className="h-3.5 w-3.5" /> Subscription
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Plans Tab ─── */}
      {activeTab === 'plans' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map(plan => (
            <div key={plan._id} className={`rounded-2xl border-2 p-6 ${plan.code === 'premium' ? 'border-purple-500' : 'border-slate-200 dark:border-slate-800'}`}>
              {plan.code === 'premium' && (
                <div className="mb-3">
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">POPULAR</span>
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {plan.basePrice === 0 ? 'Free' : `\u20B9${plan.basePrice.toLocaleString('en-IN')}`}
                </span>
                {plan.basePrice > 0 && <span className="text-sm text-slate-500">/year</span>}
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <LimitRow label="Students" value={plan.defaultLimits?.maxStudents} />
                <LimitRow label="Teachers" value={plan.defaultLimits?.maxTeachers} />
                <LimitRow label="Staff" value={plan.defaultLimits?.maxStaff} />
                <LimitRow label="Branches" value={plan.defaultLimits?.maxBranches} />
                <LimitRow label="Storage" value={plan.defaultLimits?.storageLimitMB ? `${plan.defaultLimits.storageLimitMB} MB` : '-'} />
                <LimitRow label="AI Credits" value={plan.defaultLimits?.aiCredits} />
                <LimitRow label="SMS Credits" value={plan.defaultLimits?.smsCredits} />
                <LimitRow label="Email Credits" value={plan.defaultLimits?.emailCredits} />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Features ({plan.defaultFeatures?.filter(f => f.status === 'enabled').length || 0} enabled)</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {plan.defaultFeatures?.filter(f => f.status === 'enabled').slice(0, 5).map(f => (
                    <span key={f.code} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <Check className="h-3 w-3 text-emerald-500" /> {f.code}
                    </span>
                  ))}
                  {plan.defaultFeatures?.filter(f => f.status === 'enabled').length > 5 && (
                    <span className="text-xs text-slate-400">+{plan.defaultFeatures.filter(f => f.status === 'enabled').length - 5} more</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modules Tab ─── */}
      {activeTab === 'modules' && analytics && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Select School</span>
              <select
                value={selectedTenant || ''}
                onChange={e => setSelectedTenant(e.target.value)}
                className="field h-10"
              >
                {analytics.schools.map(s => (
                  <option key={s.tenantId} value={s.tenantId}>{s.name} ({s.tenantId})</option>
                ))}
              </select>
            </label>
          </div>

          {modulesLoading ? (
            <LoadingState message="Loading modules..." />
          ) : (
            <div className="space-y-4">
              {Object.entries(
                modules.reduce((acc, m) => {
                  const cat = m.category || 'other'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(m)
                  return acc
                }, {})
              ).map(([category, items]) => (
                <div key={category} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <h3 className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{category}</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map(m => (
                      <div
                        key={m.code}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                          m.status === 'enabled'
                            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/5'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.name}</p>
                          <p className="truncate text-xs text-slate-500">{m.code}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`text-xs font-medium ${m.status === 'enabled' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                              {m.status === 'enabled' ? 'Enabled' : 'Disabled'}
                            </span>
                            <span className="text-xs text-slate-400">via {m.source}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleModule(m.code, m.status)}
                          disabled={togglingModule === m.code}
                          className={`ml-3 flex-shrink-0 transition-all ${
                            m.status === 'enabled'
                              ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
                          }`}
                        >
                          {togglingModule === m.code ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : m.status === 'enabled' ? (
                            <ToggleRight className="h-7 w-7" />
                          ) : (
                            <ToggleLeft className="h-7 w-7" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Assign Plan Modal ─── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="fixed inset-0 bg-slate-950/50" onClick={() => setAssignModal(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Assign Subscription</h3>
                <p className="mt-1 text-xs text-slate-500">{assignModal.schoolName} ({assignModal.tenantId})</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-4 space-y-4">
              <SelectField
                label="Select Plan"
                value={assignModal.planCode}
                onChange={e => {
                  const plan = plans.find(p => p.code === e.target.value)
                  setAssignModal({ ...assignModal, planCode: e.target.value, agreedPrice: plan?.basePrice || '', finalPrice: plan?.basePrice || '' })
                }}
                options={plans.filter(p => p.code !== 'free').map(p => ({ value: p.code, label: `${p.name} - \u20B9${p.basePrice.toLocaleString('en-IN')}/year` }))}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Billing Cycle"
                  value={assignModal.billingCycle}
                  onChange={e => setAssignModal({ ...assignModal, billingCycle: e.target.value })}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                    { value: 'quarterly', label: 'Quarterly' },
                  ]}
                />
                <InputField
                  label="Valid Until (optional)"
                  type="date"
                  value={assignModal.validUntil}
                  onChange={e => setAssignModal({ ...assignModal, validUntil: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Agreed Price (\u20B9)"
                  type="number"
                  value={assignModal.agreedPrice}
                  onChange={e => setAssignModal({ ...assignModal, agreedPrice: e.target.value })}
                  placeholder="Base price"
                />
                <InputField
                  label="Final Price (\u20B9)"
                  type="number"
                  value={assignModal.finalPrice}
                  onChange={e => setAssignModal({ ...assignModal, finalPrice: e.target.value })}
                  placeholder="After discount"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <Checkbox checked={assignModal.trial} onChange={e => setAssignModal({ ...assignModal, trial: e.target.checked })} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark as trial</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setAssignModal(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAssignPlan} disabled={assigning || !assignModal.planCode} className="btn btn-primary gap-2">
                <Zap className="h-4 w-4" /> {assigning ? 'Assigning...' : 'Assign Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

function LimitRow({ label, value }) {
  const display = value === -1 || value === undefined ? (value === -1 ? 'Unlimited' : '-') : value
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white">{display}</span>
    </div>
  )
}
