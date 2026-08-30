import { clsx } from 'clsx'

interface FormErrorProps {
  message?: string
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null

  return (
    <div
      className={clsx(
        'rounded bg-red-50 border border-status-error p-3 text-sm text-status-error',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <p className="font-medium">Error</p>
      <p className="mt-1">{message}</p>
    </div>
  )
}
