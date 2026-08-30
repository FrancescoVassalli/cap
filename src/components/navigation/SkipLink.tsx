interface SkipLinkProps {
  label: string
}

/**
 * Screen-reader and keyboard first link that jumps to the main content landmark.
 * Visually hidden until focused.
 */
export function SkipLink({ label }: SkipLinkProps) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-cap-primary focus:shadow-md focus:outline-none focus:ring-2 focus:ring-cap-primary"
    >
      {label}
    </a>
  )
}