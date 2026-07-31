import { useState, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, MoreHorizontal, Inbox, Loader2, AlertCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] gradient-text">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
)

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800 ${className}`} />

export const EmptyState = ({ title, description, action }) => (
  <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 text-center dark:border-slate-700">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><Inbox className="h-5 w-5" /></div>
    <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
)

export const Avatar = ({ name = '', src, className = '' }) => (
  <div className={`gradient-brand flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white shadow-md ${className}`}>
    {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
  </div>
)

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300',
    info: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]} ${className}`}>{children}</span>
}

export const StatusBadge = ({ value }) => {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    enrolled: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300',
    partial: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
    overdue: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300',
    rejected: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300'
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[value] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-300'}`}>{value || 'Unknown'}</span>
}

export const TableToolbar = ({ value, onChange, placeholder = 'Search records', filters, bulkAction, exportAction }) => (
  <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center dark:border-slate-800">
    <label className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={onChange} placeholder={placeholder} className="field h-10 pl-9" />
    </label>
    <div className="flex items-center gap-2">
      {filters}
      {bulkAction}
      {exportAction}
      <button className="icon-button" aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></button>
    </div>
  </div>
)

export const FilterButton = ({ children = 'Filter' }) => <button className="btn-secondary h-10 gap-2"><SlidersHorizontal className="h-4 w-4" />{children}</button>

export const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 text-center dark:border-slate-700">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
  </div>
)

export const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
  <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/30 px-6 text-center dark:border-red-900/30 dark:bg-red-500/5">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"><AlertCircle className="h-5 w-5" /></div>
    <h3 className="mt-4 text-sm font-semibold text-red-800 dark:text-red-200">{title}</h3>
    {message && <p className="mt-1 max-w-sm text-sm text-red-600/80 dark:text-red-300/80">{message}</p>}
    {onRetry && <button onClick={onRetry} className="btn btn-secondary mt-5">Try again</button>}
  </div>
)

export const InputField = ({ label, error, helper, id, className = '', ...props }) => (
  <div className={className}>
    {label && <label htmlFor={id} className="label">{label}{props.required && <span className="ml-1 text-red-500">*</span>}</label>}
    <input id={id} className={`field ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`} {...props} />
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    {helper && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
  </div>
)

export const SelectField = ({ label, error, helper, id, options = [], placeholder, className = '', ...props }) => (
  <div className={className}>
    {label && <label htmlFor={id} className="label">{label}{props.required && <span className="ml-1 text-red-500">*</span>}</label>}
    <div className="relative">
      <select id={id} className={`field appearance-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    {helper && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
  </div>
)

export const TextAreaField = ({ label, error, helper, id, className = '', ...props }) => (
  <div className={className}>
    {label && <label htmlFor={id} className="label">{label}{props.required && <span className="ml-1 text-red-500">*</span>}</label>}
    <textarea id={id} className={`field min-h-[100px] ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`} {...props} />
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    {helper && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
  </div>
)

export const ConfirmDialog = ({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'danger' }) => {
  if (!open) return null
  const confirmClass = variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="fixed inset-0 bg-slate-950/50" onClick={onCancel} aria-label="Close dialog" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"><AlertCircle className="h-5 w-5" /></div>
          <div>
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h3>
            {message && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="btn btn-secondary">{cancelLabel}</button>
          <button onClick={onConfirm} className={confirmClass}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export const DropdownMenu = ({ trigger, items }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="icon-button h-8 w-8" aria-label="Open actions">{trigger}</button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {item.icon && <item.icon className="h-4 w-4" />}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const Pagination = ({ page, hasNext, hasPrev, onChange, totalText }) => (
  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
    {totalText ? <p className="text-sm text-slate-500">{totalText}</p> : <div />}
    <div className="flex gap-1">
      <button onClick={() => onChange(page - 1)} disabled={!hasPrev} className="icon-button h-8 w-8 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
      <button onClick={() => onChange(page + 1)} disabled={!hasNext} className="icon-button h-8 w-8 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
    </div>
  </div>
)

export const Checkbox = ({ className = '', ...props }) => (
  <input type="checkbox" className={`h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 ${className}`} {...props} />
)
