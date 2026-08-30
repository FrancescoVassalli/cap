import type { PropsWithChildren } from 'react'
import { clsx } from 'clsx'

interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const sizeStyles: Record<ContainerSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  full: 'max-w-full',
}

export function Container({
  size = 'md',
  className,
  children,
}: PropsWithChildren<ContainerProps>) {
  return (
    <div
      className={clsx(
        'mx-auto px-4 sm:px-6 lg:px-8 w-full',
        sizeStyles[size],
        className
      )}
    >
      {children}
    </div>
  )
}
