import { useEffect, useRef } from 'react'

export interface ErrorSummaryEntry {
  id: string
  label: string
  message: string
  focusId: string
}

interface ErrorSummaryProps {
  heading: string
  entries: ErrorSummaryEntry[]
  autoFocus?: boolean
  onAutoFocused?: () => void
}

export function ErrorSummary({ heading, entries, autoFocus = false, onAutoFocused }: ErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && summaryRef.current) {
      summaryRef.current.focus()
      onAutoFocused?.()
    }
  }, [autoFocus, onAutoFocused])

  const handleFocusField = (focusId: string) => {
    const element = document.getElementById(focusId)
    if (element) {
      element.focus()
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }

  return (
    <div
      ref={summaryRef}
      tabIndex={-1}
      role="alert"
      className="rounded-xl border border-status-error bg-red-50 p-4 focus:outline-none focus:ring-2 focus:ring-status-error focus:ring-offset-2"
    >
      <p className="text-base font-semibold text-status-error">{heading}</p>
      <ul className="mt-2 space-y-1">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => handleFocusField(entry.focusId)}
              className="text-sm font-medium text-status-error underline underline-offset-2"
            >
              {entry.label}: {entry.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}