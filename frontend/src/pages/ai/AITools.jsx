import { useState } from 'react'
import { useAI } from '../../hooks/useAI'
import { PageHeader } from '../../components/ui'
import { Sparkles, MessageSquare, Smile, FileSearch, Send, Wand2 } from 'lucide-react'

const AITools = () => {
  const { loading, summarize, analyzeSentiment, suggestReplies, extractEntities, getInsights } = useAI()
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [activeTool, setActiveTool] = useState('summarize')
  const [insights, setInsights] = useState([])

  const runTool = async () => {
    setResult(null)
    try {
      let data = null
      if (activeTool === 'summarize') data = await summarize(text, 120)
      if (activeTool === 'sentiment') data = await analyzeSentiment(text)
      if (activeTool === 'replies') data = await suggestReplies(text)
      if (activeTool === 'entities') data = await extractEntities(text)
      setResult(data)
    } catch (error) { /* handled by hook */ }
  }

  const loadInsights = async () => {
    try {
      const res = await getInsights()
      setInsights(res.data.insights || [])
    } catch (error) { /* handled by hook */ }
  }

  const tools = [
    { id: 'summarize', label: 'Summarize', icon: FileSearch, placeholder: 'Paste a long notice, report, or message to summarize...' },
    { id: 'sentiment', label: 'Sentiment', icon: Smile, placeholder: 'Enter feedback or message text...' },
    { id: 'replies', label: 'Reply Suggestions', icon: MessageSquare, placeholder: 'Enter a parent or staff message context...' },
    { id: 'entities', label: 'Extract Info', icon: Sparkles, placeholder: 'Paste text containing dates, emails, amounts...' },
  ]

  const renderResult = () => {
    if (!result) return null
    if (activeTool === 'summarize') return <p className="text-sm text-slate-700 dark:text-slate-200">{result.data?.summary}</p>
    if (activeTool === 'sentiment') return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${result.data?.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : result.data?.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{result.data?.sentiment}</span>
    if (activeTool === 'replies') return (
      <ul className="space-y-2">
        {result.data?.map((reply, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-200">• {reply}</li>)}
      </ul>
    )
    if (activeTool === 'entities') return (
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Dates:</span> {result.data?.dates?.join(', ') || '—'}</p>
        <p><span className="font-medium">Emails:</span> {result.data?.emails?.join(', ') || '—'}</p>
        <p><span className="font-medium">Amounts:</span> {result.data?.amounts?.join(', ') || '—'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI Assistant" title="EduPilot AI Tools" description="Summarize, analyze sentiment, and extract insights from school data" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tools.map(tool => (
              <button key={tool.id} onClick={() => { setActiveTool(tool.id); setResult(null) }} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${activeTool === tool.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                <tool.icon className="h-4 w-4" />{tool.label}
              </button>
            ))}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={tools.find(t => t.id === activeTool)?.placeholder} className="field min-h-[160px]" />
          <button onClick={runTool} disabled={loading || !text.trim()} className="btn btn-primary w-full gap-2"><Wand2 className="h-4 w-4" />{loading ? 'Processing...' : 'Run AI Tool'}</button>

          {result && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-500/5">
              <h3 className="mb-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200">Result</h3>
              {renderResult()}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Dashboard Insights</h3>
          </div>
          <button onClick={loadInsights} disabled={loading} className="btn btn-secondary w-full gap-2"><Send className="h-4 w-4" />{loading ? 'Loading...' : 'Generate Insights'}</button>
          {insights.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Click generate to see AI-powered insights.</p> : (
            <ul className="space-y-2">
              {insights.map((insight, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-200">• {insight}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default AITools
