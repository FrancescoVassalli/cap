import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  isInvalid?: boolean
}

const baseStyles =
  'h-5 w-5 rounded border-2 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cap-primary cursor-pointer'

const validStyles =
  'border-slate-300 bg-white text-cap-primary hover:border-slate-400 checked:bg-cap-primary checked:border-cap-primary'

const invalidStyles =
  'border-status-error bg-red-50 checked:bg-status-error checked:border-status-error focus-visible:ring-status-error'

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, isInvalid = false, className, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          className={clsx(
            baseStyles,
            isInvalid ? invalidStyles : validStyles,
            className
          )}
          {...props}
        />
        {label && <label className="text-sm text-slate-900">{label}</label>}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
