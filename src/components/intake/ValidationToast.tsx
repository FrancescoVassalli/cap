interface ValidationToastProps {
  type: 'valid' | 'invalid'
  message: string
  dismissLabel: string
  onDismiss: () => void
}

export function ValidationToast({ type, message, dismissLabel, onDismiss }: ValidationToastProps) {
  const isValid = type === 'valid'

  return (
    <div
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border-2 px-4 py-3 shadow-lg ${
        isValid
          ? 'border-status-success bg-green-50 text-status-success'
          : 'border-status-error bg-red-50 text-status-error'
      }`}
      role="status"
      aria-live={isValid ? 'polite' : 'assertive'}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          className="text-sm font-semibold underline underline-offset-2"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          x
        </button>
      </div>
    </div>
  )
}
