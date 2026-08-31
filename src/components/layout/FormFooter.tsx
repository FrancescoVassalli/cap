import type { PropsWithChildren } from 'react'
import { clsx } from 'clsx'

interface FormFooterProps {
  onBack?: () => void
  onContinue?: () => void
  backLabel?: string
  continueLabel?: string
  showBack?: boolean
  isLoading?: boolean
  isDisabled?: boolean
  className?: string
}

export function FormFooter({
  onBack,
  onContinue,
  backLabel = 'Back',
  continueLabel = 'Continue',
  showBack = true,
  isLoading = false,
  isDisabled = false,
  className,
  children,
}: PropsWithChildren<FormFooterProps>) {
  return (
    <div
      className={clsx(
        'flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8 pt-6 border-t border-slate-200',
        className
      )}
    >
      {showBack && (
        <button
          onClick={onBack}
          disabled={isLoading || isDisabled}
          className="px-6 py-3 min-h-touch min-w-touch border-2 border-cap-primary text-cap-primary rounded font-medium hover:bg-cap-primary hover:text-white transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cap-primary"
        >
          {backLabel}
        </button>
      )}
      {children ? (
        children
      ) : (
        <button
          onClick={onContinue}
          disabled={isLoading || isDisabled}
          className={clsx(
            'px-6 py-3 min-h-touch min-w-touch bg-cap-primary text-white rounded font-medium hover:bg-cap-primary/90 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cap-primary',
            isLoading && 'flex items-center justify-center gap-2'
          )}
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </>
          ) : (
            continueLabel
          )}
        </button>
      )}
    </div>
  )
}
