import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Building2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [tab, setTab] = useState('staff')
  const [loading, setLoading] = useState(false)
  const [staffForm, setStaffForm] = useState({ email: '', password: '' })
  const [parentForm, setParentForm] = useState({ rollNo: '', dateOfBirth: '' })

  const handleStaffSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(staffForm.email, staffForm.password)
    setLoading(false)
    if (result.success) navigate('/dashboard')
  }

  const handleParentSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/parent-login', parentForm)
      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        if (data.user.tenantId) localStorage.setItem('tenantId', data.user.tenantId)
        if (data.user.schoolId) localStorage.setItem('schoolId', data.user.schoolId)
        toast.success('Login successful')
        navigate('/parent/dashboard')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg"><Building2 className="h-6 w-6 text-white" /></div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">School Manager</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to your school workspace</p>
        </div>

        <div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setTab('staff')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'staff' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
          >
            <Building2 className="h-4 w-4" /> Staff
          </button>
          <button
            type="button"
            onClick={() => setTab('parent')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'parent' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
          >
            <Users className="h-4 w-4" /> Parent
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          {tab === 'staff' ? (
            <form onSubmit={handleStaffSubmit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input type="email" name="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="field" placeholder="admin@school.com" required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" name="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} className="field" placeholder="Enter your password" required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Signing in...' : 'Sign In'}</button>
            </form>
          ) : (
            <form onSubmit={handleParentSubmit} className="space-y-5">
              <div>
                <label className="label">Roll Number</label>
                <input type="text" name="rollNo" value={parentForm.rollNo} onChange={(e) => setParentForm({ ...parentForm, rollNo: e.target.value })} className="field" placeholder="Enter student roll number" required />
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={parentForm.dateOfBirth} onChange={(e) => setParentForm({ ...parentForm, dateOfBirth: e.target.value })} className="field" required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Signing in...' : 'Sign In'}</button>
            </form>
          )}

          {tab === 'staff' && (
            <p className="mt-6 text-center text-sm text-slate-500">Don&apos;t have an account? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">Register</Link></p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
