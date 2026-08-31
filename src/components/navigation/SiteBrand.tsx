import { Link } from 'react-router-dom'

interface SiteBrandProps {
  brand: string
  alt: string
}

/**
 * Brand logo that links back to the informational home route.
 * The full program name is announced to assistive technology via the
 * link's accessible name; the logo image itself is decorative (alt="").
 */
export function SiteBrand({ brand, alt }: SiteBrandProps) {
  return (
    <Link
      to="/how-we-help"
      aria-label={alt}
      className="inline-flex min-h-touch min-w-touch items-center rounded-md px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-primary focus-visible:ring-offset-2"
    >
      <img src="/CCHI_Logo.png" alt="" className="h-10 w-auto" />
      <span className="sr-only">{brand}</span>
    </Link>
  )
}