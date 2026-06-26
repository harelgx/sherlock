import { useEffect, useMemo, useState } from 'react'
import { useErrorFeed } from './useErrorFeed'
import { ErrorCard } from './ErrorCard'

const WS_URL = 'ws://localhost:4000'
const MAX_DISPLAY = 200

type Theme = 'light' | 'dark'
type Filter = 'all' | '5xx' | '4xx' | 'err'

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function ConnectionStatus({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) {
  const dot =
    status === 'connected'    ? 'bg-emerald-500' :
    status === 'connecting'   ? 'bg-amber-400 animate-pulse' :
                                'bg-red-500'
  const label =
    status === 'connected'    ? 'live' :
    status === 'connecting'   ? 'connecting' :
                                'disconnected'
  return (
    <span className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

export default function App() {
  const { errors, status } = useErrorFeed(WS_URL)
  const [filter, setFilter] = useState<Filter>('all')

  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const counts = useMemo(() => ({
    all:   errors.length,
    '5xx': errors.filter(e => (e.context.response?.statusCode ?? 0) >= 500).length,
    '4xx': errors.filter(e => { const c = e.context.response?.statusCode ?? 0; return c >= 400 && c < 500 }).length,
    err:   errors.filter(e => !e.context.response).length,
  }), [errors])

  const filtered = useMemo(() => {
    let result = errors
    if (filter === '5xx') result = errors.filter(e => (e.context.response?.statusCode ?? 0) >= 500)
    else if (filter === '4xx') result = errors.filter(e => { const c = e.context.response?.statusCode ?? 0; return c >= 400 && c < 500 })
    else if (filter === 'err') result = errors.filter(e => !e.context.response)
    return result.slice(0, MAX_DISPLAY)
  }, [errors, filter])

  const hasErrors = errors.length > 0

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
        <div className="h-11 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium tracking-tight">Sherlock</span>
            <ConnectionStatus status={status} />
          </div>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Filter bar — only when there are errors */}
        {hasErrors && (
          <div className="h-9 px-6 flex items-center border-t border-neutral-100 dark:border-neutral-900">
            <div className="flex items-center gap-0.5">
              {(['all', '5xx', '4xx', 'err'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    filter === f
                      ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                      : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400'
                  }`}
                >
                  {f}
                  {counts[f] > 0 && (
                    <span className="ml-1.5 tabular-nums opacity-40">{counts[f]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Error list */}
      <main>
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-neutral-300 dark:text-neutral-700 py-32">
            {status === 'connected' ? 'waiting for errors…' : 'connecting…'}
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {filtered.map(err => (
              <ErrorCard key={err._id} error={err} />
            ))}
          </div>
        )}

        {errors.length > MAX_DISPLAY && (
          <p className="text-center text-xs text-neutral-300 dark:text-neutral-700 py-4 border-t border-neutral-100 dark:border-neutral-900">
            showing latest {MAX_DISPLAY} of {errors.length}
          </p>
        )}
      </main>

    </div>
  )
}
