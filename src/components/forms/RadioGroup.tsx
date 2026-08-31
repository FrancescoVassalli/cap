import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface RadioOption {
  value: string
  label: string
}

interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'name' | 'value' | 'checked'> {
  name: string
  options: RadioOption[]
  /** The currently selected option value. Determines which radio is checked. */
  value?: string
  isInvalid?: boolean
  orientation?: 'horizontal' | 'vertical'
}

const radioBaseStyles =
  'h-5 w-5 border-2 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cap-primary cursor-pointer'

const validStyles =
  'border-slate-300 bg-white text-cap-primary hover:border-slate-400 checked:bg-cap-primary checked:border-cap-primary'

const invalidStyles =
  'border-status-error bg-red-50 checked:bg-status-error checked:border-status-error focus-visible:ring-status-error'

export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  (
    { name, options, value, isInvalid = false, orientation = 'vertical', className, ...props },
    ref
  ) => {
    return (
      <fieldset
        className={clsx(
          'space-y-2',
          orientation === 'horizontal' && 'flex gap-4 flex-wrap',
          className
        )}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <input
              ref={ref}
              id={`${name}-${option.value}`}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              className={clsx(
                radioBaseStyles,
                isInvalid ? invalidStyles : validStyles
              )}
              {...props}
            />
            <label htmlFor={`${name}-${option.value}`} className="text-base text-slate-900 cursor-pointer">
              {option.label}
            </label>
          </div>
        ))}
      </fieldset>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'
