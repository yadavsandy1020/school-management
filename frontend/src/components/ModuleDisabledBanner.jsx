import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ModuleDisabledBanner() {
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      setMessage(e.detail?.message || 'This module is not enabled for your school.')
    }
    window.addEventListener('module-disabled', handler)
    return () => window.removeEventListener('module-disabled', handler)
  }, [])

  if (!message) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-200">{message}</p>
      <button onClick={() => setMessage(null)} className="flex-shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-400">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
