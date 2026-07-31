import { useEffect, useState } from 'react'
import api from '../utils/api'
import { PageHeader, Skeleton } from './ui'
import { Wallet, CreditCard, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
const currentYear = new Date().getFullYear()

const FinancePanel = () => {
  const [teachers, setTeachers] = useState([])
  const [salaries, setSalaries] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingSalary, setSavingSalary] = useState(false)
  const [savingExpense, setSavingExpense] = useState(false)

  const [salaryForm, setSalaryForm] = useState({
    teacherId: '',
    amount: '',
    month: currentMonth,
    year: currentYear,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'bank_transfer',
    transactionId: '',
    notes: ''
  })

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMode: 'cash',
    receiptUrl: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tRes, sRes, eRes] = await Promise.all([
        api.get('/teachers?limit=1000'),
        api.get('/finance/salaries'),
        api.get('/finance/expenses')
      ])
      setTeachers(tRes.data.data || [])
      setSalaries(sRes.data.data || [])
      setExpenses(eRes.data.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSalarySubmit = async (e) => {
    e.preventDefault()
    try {
      setSavingSalary(true)
      await api.post('/finance/salaries', {
        ...salaryForm,
        amount: Number(salaryForm.amount),
        year: Number(salaryForm.year)
      })
      toast.success('Salary payment recorded')
      setSalaryForm({ ...salaryForm, amount: '', transactionId: '', notes: '' })
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record salary')
    } finally {
      setSavingSalary(false)
    }
  }

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    try {
      setSavingExpense(true)
      await api.post('/finance/expenses', {
        ...expenseForm,
        amount: Number(expenseForm.amount)
      })
      toast.success('Expense recorded')
      setExpenseForm({
        title: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMode: 'cash',
        receiptUrl: ''
      })
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record expense')
    } finally {
      setSavingExpense(false)
    }
  }

  const deleteSalary = async (id) => {
    if (!window.confirm('Delete this salary payment?')) return
    try {
      await api.delete(`/finance/salaries/${id}`)
      toast.success('Salary payment deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete salary payment')
    }
  }

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await api.delete(`/finance/expenses/${id}`)
      toast.success('Expense deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete expense')
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const paymentModes = ['cash', 'bank_transfer', 'cheque', 'upi', 'online']

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Finance"
        title="Teacher Salaries & School Expenses"
        description="Record salary payouts and operational expenses"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Record Salary Payment</h3>
          </div>
          <form onSubmit={handleSalarySubmit} className="space-y-3">
            <div>
              <label className="label">Teacher</label>
              <select
                className="field"
                value={salaryForm.teacherId}
                onChange={(e) => setSalaryForm({ ...salaryForm, teacherId: e.target.value })}
                required
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.personalInfo?.firstName} {t.personalInfo?.lastName} ({t.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  value={salaryForm.amount}
                  onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Payment Date</label>
                <input
                  type="date"
                  className="field"
                  value={salaryForm.paymentDate}
                  onChange={(e) => setSalaryForm({ ...salaryForm, paymentDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Month</label>
                <input
                  type="text"
                  className="field"
                  value={salaryForm.month}
                  onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })}
                  placeholder="MM"
                  required
                />
              </div>
              <div>
                <label className="label">Year</label>
                <input
                  type="number"
                  className="field"
                  value={salaryForm.year}
                  onChange={(e) => setSalaryForm({ ...salaryForm, year: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Payment Mode</label>
                <select
                  className="field"
                  value={salaryForm.paymentMode}
                  onChange={(e) => setSalaryForm({ ...salaryForm, paymentMode: e.target.value })}
                >
                  {paymentModes.map((m) => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Transaction ID</label>
                <input
                  type="text"
                  className="field"
                  value={salaryForm.transactionId}
                  onChange={(e) => setSalaryForm({ ...salaryForm, transactionId: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="field"
                rows="2"
                value={salaryForm.notes}
                onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
              />
            </div>
            <button type="submit" disabled={savingSalary} className="btn btn-primary w-full gap-2">
              <Plus className="h-4 w-4" />
              {savingSalary ? 'Saving...' : 'Record Payment'}
            </button>
          </form>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Record School Expense</h3>
          </div>
          <form onSubmit={handleExpenseSubmit} className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                className="field"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <input
                  type="text"
                  className="field"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  placeholder="e.g. Utilities"
                  required
                />
              </div>
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="field"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="field"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Payment Mode</label>
                <select
                  className="field"
                  value={expenseForm.paymentMode}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                >
                  {paymentModes.map((m) => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="field"
                rows="2"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Receipt URL</label>
              <input
                type="text"
                className="field"
                value={expenseForm.receiptUrl}
                onChange={(e) => setExpenseForm({ ...expenseForm, receiptUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <button type="submit" disabled={savingExpense} className="btn btn-primary w-full gap-2">
              <Plus className="h-4 w-4" />
              {savingExpense ? 'Saving...' : 'Record Expense'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Salary Payments</h3>
          <div className="mt-4 space-y-3">
            {salaries.length === 0 ? (
              <p className="text-sm text-slate-500">No salary payments recorded yet.</p>
            ) : (
              salaries.slice(0, 5).map((s) => (
                <div
                  key={s._id}
                  className="flex items-start justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {s.teacherId?.personalInfo?.firstName} {s.teacherId?.personalInfo?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{s.month}/{s.year} • {s.paymentMode.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{s.amount.toLocaleString()}</span>
                    <button onClick={() => deleteSalary(s._id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Expenses</h3>
          <div className="mt-4 space-y-3">
            {expenses.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses recorded yet.</p>
            ) : (
              expenses.slice(0, 5).map((e) => (
                <div
                  key={e._id}
                  className="flex items-start justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.category} • {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{e.amount.toLocaleString()}</span>
                    <button onClick={() => deleteExpense(e._id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancePanel
