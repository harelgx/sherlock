import { memo, useState } from 'react'
import type { DiagnosisResult, EnrichedError } from './types'

function statusColor(code: number | undefined): string {
  if (code === undefined) return 'text-neutral-400 dark:text-neutral-500'
  if (code >= 500) return 'text-red-500 dark:text-red-400'
  if (code >= 400) return 'text-amber-600 dark:text-amber-500'
  return 'text-neutral-500'
}

function borderColor(code: number | undefined): string {
  if (code === undefined) return 'border-red-500'
  if (code >= 500) return 'border-red-500'
  if (code >= 400) return 'border-amber-500'
  return 'border-neutral-600'
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function DiagRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-400">
        {label}
      </p>
      <p className="text-xs text-neutral-200 leading-relaxed">
        {text}
      </p>
    </div>
  )
}

function Diagnosis({ d }: { d: DiagnosisResult }) {
  const hasContent = d.diagnosis || d.action
  if (!hasContent) {
    return (
      <p className="text-[10px] font-mono text-neutral-600 italic">not enriched</p>
    )
  }
  return (
    <div className="space-y-2">
      {d.diagnosis && <DiagRow label="Diagnosis" text={d.diagnosis} />}
      {d.action    && <DiagRow label="Action"    text={d.action} />}
    </div>
  )
}

export const ErrorCard = memo(function ErrorCard({ error }: { error: EnrichedError }) {
  const [expanded, setExpanded] = useState(false)
  const { context, explanation } = error
  const { request, response, nodeError, callingService, upstream, timestamp } = context
  const statusCode = response?.statusCode

  const toggle = () => setExpanded(v => !v)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      className="px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700 animate-slide-in"
      onClick={toggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
    >
      {/* Row 1: status · method · url · enrichment dot · timestamp · chevron */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold tabular-nums w-8 shrink-0 ${statusColor(statusCode)}`}>
          {statusCode ?? 'ERR'}
        </span>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
          {request.method}
        </span>
        <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate flex-1 min-w-0">
          {request.url}
        </span>
<span className="text-xs text-neutral-300 dark:text-neutral-700 tabular-nums shrink-0">
          {formatTs(timestamp)}
        </span>
        <svg
          className={`w-3 h-3 text-neutral-300 dark:text-neutral-700 shrink-0 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded: service→upstream · nodeError · diagnosis */}
      {expanded && (
        <div className={`mt-2 ml-4 border-l-2 ${borderColor(statusCode)} bg-neutral-900/40 rounded-r py-2 pr-3 max-w-[680px] space-y-2.5`}>
          <div className="pl-7 flex items-center gap-3">
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {callingService}
              <span className="text-neutral-400 dark:text-neutral-500 mx-2">→</span>
              {upstream}
            </span>
            {nodeError && (
              <span className="text-xs text-red-400 dark:text-red-500">
                {nodeError.code}
              </span>
            )}
          </div>
          <div className="pl-7">
            <Diagnosis d={explanation} />
          </div>
        </div>
      )}
    </div>
  )
})
