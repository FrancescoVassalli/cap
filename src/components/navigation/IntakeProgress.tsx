import { clsx } from 'clsx'

interface IntakeProgressProps {
  current: number
  total: number
  progressText: string
  ariaLabel: string
}

/**
 * Calm, mobile-friendly progress indicator for the multi-step intake flow.
 * The visible text keeps the user oriented without relying on color or shape alone.
 */
export function IntakeProgress({ current, total, progressText, ariaLabel }: IntakeProgressProps) {
  return (
    <div role="group" aria-label={ariaLabel} className="space-y-2">
      <p className="text-sm font-medium text-slate-600">{progressText}</p>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-colors duration-200',
              index < current ? 'bg-cap-primary' : 'bg-slate-200',
            )}
          />
        ))}
      </div>
    </div>
  )
}