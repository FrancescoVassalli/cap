import {
  cloneElement,
  isValidElement,
  useId,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react'
import { clsx } from 'clsx'

interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  htmlFor?: string
  className?: string
}

type DescribedByChild = {
  'aria-describedby'?: string
}

function withDescribedBy(children: ReactNode, describedBy: string | undefined) {
  if (!describedBy || !isValidElement(children)) {
    return children
  }

  const child = children as ReactElement<DescribedByChild>
  const existingDescribedBy = child.props['aria-describedby']
  const ids = [existingDescribedBy, describedBy].filter(Boolean).join(' ')

  return cloneElement(child, { 'aria-describedby': ids || undefined })
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
  const baseId = useId().replace(/:/g, '')
  const hintId = hint && !error ? `${baseId}-hint` : undefined
  const errorId = error ? `${baseId}-error` : undefined
  const describedBy = errorId ?? hintId

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
      <div>{withDescribedBy(children, describedBy)}</div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-status-error font-medium">
          {error}
        </p>
      )}
    </div>
  )
}
