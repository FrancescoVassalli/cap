import type { InputHTMLAttributes } from 'react'
import { forwardRef, useRef } from 'react'
import { clsx } from 'clsx'

interface FileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean
  label?: string
}

const baseStyles =
  'block w-full text-sm text-slate-600 file:mr-4 file:px-4 file:py-2.5 file:rounded file:border-0 file:text-sm file:font-medium file:bg-cap-primary file:text-white hover:file:bg-cap-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cap-primary'

const validStyles = 'file:cursor-pointer'

const invalidStyles =
  'text-status-error focus-visible:ring-status-error file:bg-status-error'

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ isInvalid = false, label, className, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    return (
      <div>
        <input
          ref={ref || inputRef}
          type="file"
          className={clsx(
            baseStyles,
            isInvalid ? invalidStyles : validStyles,
            className
          )}
          {...props}
        />
        {label && <p className="mt-2 text-xs text-slate-600">{label}</p>}
      </div>
    )
  }
)

FileInput.displayName = 'FileInput'
