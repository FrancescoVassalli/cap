import type { PropsWithChildren } from 'react'
import { clsx } from 'clsx'

type AlertType = 'error' | 'success' | 'info' | 'warning'

interface AlertProps {
  type?: AlertType
  title?: string
  className?: string
}

const typeStyles: Record<AlertType, string> = {
  error: 'bg-red-50 border-status-error text-status-error',
  success: 'bg-green-50 border-status-success text-status-success',
  info: 'bg-blue-50 border-cap-primary text-cap-primary',
  warning: 'bg-amber-50 border-amber-600 text-amber-900',
}

export function Alert({
  type = 'info',
  title,
  className,
  children,
}: PropsWithChildren<AlertProps>) {
  return (
    <div
      className={clsx(
        'rounded-lg border-2 p-4',
        typeStyles[type],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {title && <p className="font-semibold mb-2">{title}</p>}
      <div className="text-sm">{children}</div>
    </div>
  )
}
