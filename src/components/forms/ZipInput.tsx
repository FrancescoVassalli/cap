import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface ZipInputProps extends InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean
}

const baseStyles =
  'w-full px-3 py-2.5 text-base border-2 rounded transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cap-primary leading-normal'

const validStyles = 'border-cap-secondary/70 bg-white text-slate-900 placeholder-slate-500 hover:border-cap-primary focus:border-cap-primary'

const invalidStyles =
  'border-status-error bg-red-50 text-slate-900 placeholder-slate-500 focus-visible:ring-status-error'

export const ZipInput = forwardRef<HTMLInputElement, ZipInputProps>(
  ({ isInvalid = false, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="12345"
        autoComplete="postal-code"
        maxLength={5}
        className={clsx(
          baseStyles,
          isInvalid ? invalidStyles : validStyles,
          className
        )}
        {...props}
      />
    )
  }
)

ZipInput.displayName = 'ZipInput'
