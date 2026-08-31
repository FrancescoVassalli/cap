import type { PropsWithChildren } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  className?: string
  variant?: 'default' | 'elevated'
}

export function Card({
  children,
  className,
  variant = 'default',
}: PropsWithChildren<CardProps>) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-white p-6',
        variant === 'default' && 'border border-cap-secondary/40',
        variant === 'elevated' && 'shadow-md',
        className
      )}
    >
      {children}
    </div>
  )
}
