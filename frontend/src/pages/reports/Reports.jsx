import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { Download, Users, GraduationCap, Landmark, TrendingUp, FileBarChart, Wallet, CreditCard } from 'lucide-react'
import { PageHeader, Skeleton } from '../../components/ui'
import FinancePanel from '../../components/FinancePanel'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Reports = () => {
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState(null)
  const [examReport, setExamReport] = useState(null)
  const [finance, setFinance] = useState(null)
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchTrends(), fetchFinance(), fetchExams()])
    setLoading(false)
  }

  const fetchStats = async () => { try { const res = await api.get('/reports/dashboard'); setStats(res.data.stats) } catch (error) { /* ignore */ } }
  const fetchTrends = async () => { try { const res = await api.get('/reports/trends'); setTrends(res.data.data) } catch (error) { /* ignore */ } }
  const fetchFinance = async () => { try { const res = await api.get('/reports/finance'); setFinance(res.data.data) } catch (error) { /* ignore */ } }
  const fetchExams = async () => { try { const res = await api.get('/exams'); setExams(res.data.data) } catch (error) { /* ignore */ } }

  useEffect(() => { if (selectedExam) fetchExamReport() }, [selectedExam])

  const fetchExamReport = async () => {
    try { const res = await api.get('/reports/exams', { params: { examId: selectedExam } }); setExamReport(res.data.data) } catch (error) { /* ignore */ }
  }

  const exportReport = async (type) => {
    try {
      const response = await api.get(`/reports/export/${type}`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) { console.error('Failed to export report:', error) }
  }

  const trendData = trends ? trends.months.map((m, i) => ({ month: m, fees: trends.feeTrend[i], expenses: trends.expenseTrend[i], attendance: trends.attendanceTrend[i] })) : []
  const financeData = finance ? [{ name: 'Fees', value: finance.income.fees }, { name: 'Salaries', value: finance.expenses.salaries }, { name: 'Expenses', value: finance.expenses.operational }] : []

  if (loading) return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>

  const cards = [
    { label: 'Total Students', value: stats?.students || 0, icon: Users, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10', type: 'students' },
    { label: 'Total Teachers', value: stats?.teachers || 0, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', type: 'teachers' },
    { label: 'Fee Collected', value: `₹${(stats?.fees?.collected || 0).toLocaleString()}`, icon: Landmark, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10', type: 'fees' },
    { label: 'Collection Rate', value: `${stats?.fees?.collectionRate || 0}%`, icon: TrendingUp, color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10', type: null },
    { label: 'Salary Paid', value: `₹${(stats?.finances?.salaries?.paid || 0).toLocaleString()}`, icon: Wallet, color: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10', type: null },
    { label: 'School Expenses', value: `₹${(stats?.finances?.expenses || 0).toLocaleString()}`, icon: CreditCard, color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10', type: null },
    { label: 'Net Position', value: `₹${(stats?.finances?.net || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10', type: null },
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Analytics" title="Reports & Analytics" description="Generate and export detailed reports" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}><card.icon className="h-5 w-5" /></div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.label}</p>
            {card.type && <button onClick={() => exportReport(card.type)} className="btn btn-secondary mt-4 w-full gap-2 text-xs"><Download className="h-3.5 w-3.5" />Export CSV</button>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Fee vs Expense</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="fees" stroke="#4f46e5" /><Line type="monotone" dataKey="expenses" stroke="#ef4444" /></LineChart></ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Finance Distribution</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={financeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>{financeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attendance Trend</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="attendance" fill="#10b981" /></BarChart></ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Exam Performance</h3>
          <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="field mt-2"><option value="">Select Exam</option>{exams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}</select>
          <div className="mt-4 h-52">
            {examReport ? (
              <ResponsiveContainer width="100%" height="100%"><BarChart data={examReport.subjectWise}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="subject" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="average" fill="#8b5cf6" /></BarChart></ResponsiveContainer>
            ) : <p className="text-sm text-slate-500 dark:text-slate-400">Select an exam to view subject averages.</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2"><FileBarChart className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Reports</h3></div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[{ title: 'Fee Collection', desc: 'Track fee collection status', type: 'fees' }, { title: 'Student Strength', desc: 'Class-wise student distribution', type: 'students' }, { title: 'Teacher Directory', desc: 'Complete staff listing', type: 'teachers' }].map((item) => (
            <button key={item.title} onClick={() => exportReport(item.type)} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h4>
              <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <FinancePanel />
    </div>
  )
}

export default Reports
