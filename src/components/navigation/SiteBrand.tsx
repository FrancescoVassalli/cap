import { Link } from 'react-router-dom'

interface SiteBrandProps {
  brand: string
  alt: string
}

/**
 * Wordmark that links back to the informational home route.
 * The full program name is announced to assistive technology.
 */
export function SiteBrand({ brand, alt }: SiteBrandProps) {
  return (
    <Link
      to="/how-we-help"
      aria-label={alt}
      className="inline-flex min-h-touch min-w-touch items-center rounded-md px-1 py-1 text-lg font-bold tracking-tight text-sky-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-primary focus-visible:ring-offset-2"
    >
      <span aria-hidden="true">{brand}</span>
    </Link>
  )
}