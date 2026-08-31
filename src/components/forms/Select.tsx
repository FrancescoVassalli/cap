import type { SelectHTMLAttributes, PropsWithChildren } from 'react'
import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  isInvalid?: boolean
  options?: Array<{ value: string; label: string }>
}

const baseStyles =
  'w-full px-3 py-2.5 text-base border-2 rounded transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cap-primary leading-normal'

const validStyles = 'border-cap-secondary/70 bg-white text-slate-900 hover:border-cap-primary focus:border-cap-primary'

const invalidStyles =
  'border-status-error bg-red-50 text-slate-900 focus-visible:ring-status-error'

export const Select = forwardRef<
  HTMLSelectElement,
  PropsWithChildren<SelectProps>
>(({ isInvalid = false, options, className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={clsx(
        baseStyles,
        isInvalid ? invalidStyles : validStyles,
        className
      )}
      {...props}
    >
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  )
})

Select.displayName = 'Select'
