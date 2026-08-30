import { clsx } from 'clsx'

interface FormHintProps {
  message?: string
  className?: string
}

export function FormHint({ message, className }: FormHintProps) {
  if (!message) return null

  return (
    <p
      className={clsx('text-xs text-slate-600', className)}
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  )
}
