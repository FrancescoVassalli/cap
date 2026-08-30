import { clsx } from 'clsx'

type ProgressBarSize = 'sm' | 'md' | 'lg'

interface ProgressBarProps {
  current: number
  total: number
  size?: ProgressBarSize
  showLabel?: boolean
  className?: string
}

const sizeStyles: Record<ProgressBarSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  current,
  total,
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className={className}>
      {showLabel && (
        <p className="mb-2 text-sm font-medium text-slate-900">
          Step {current} of {total}
        </p>
      )}
      <div className={clsx('w-full bg-slate-200 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className="bg-cap-primary h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
        />
      </div>
    </div>
  )
}
