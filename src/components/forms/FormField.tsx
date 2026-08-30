import type { PropsWithChildren } from 'react'
import { clsx } from 'clsx'

interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  htmlFor?: string
  className?: string
}

export function FormField({
  label,
  error,
  hint,
  required = false,
  htmlFor,
  className,
  children,
}: PropsWithChildren<FormFieldProps>) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-900"
        >
          {label}
          {required && <span className="ml-1 text-status-error">*</span>}
        </label>
      )}
      <div>{children}</div>
      {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
      {error && <p className="text-xs text-status-error font-medium">{error}</p>}
    </div>
  )
}
