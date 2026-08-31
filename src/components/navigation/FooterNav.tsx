import { Link } from 'react-router-dom'
import type { AllContent } from '@/content'

interface FooterNavProps {
  content: AllContent
}

const footerLinks: Array<{ to: string; key: 'howWeHelp' | 'getHelp' }> = [
  { to: '/how-we-help', key: 'howWeHelp' },
  { to: '/intake', key: 'getHelp' },
]

/**
 * Footer that mirrors the top-level destinations, adds the legal disclaimer
 * from the content layer, and closes with the copyright notice.
 */
export function FooterNav({ content }: FooterNavProps) {
  const { navigation, legal } = content

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <img
            src="/CCHI_Logo.png"
            alt={navigation.logo.alt}
            className="h-10 w-auto"
          />
          <p className="mt-3 text-sm text-slate-600">{navigation.brand}</p>
        </div>

        <nav
          aria-label={navigation.footer.navLabel}
          className="flex flex-col items-start gap-1 text-sm sm:items-end"
        >
          {footerLinks.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="inline-flex min-h-touch min-w-touch items-center rounded-md px-2 py-1 text-slate-600 underline-offset-4 transition-colors hover:text-sky-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-primary focus-visible:ring-offset-2"
            >
              {navigation.mainNav[item.key]}
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
        <p>{legal.disclaimer.content}</p>
        <p>{navigation.footer.copyright}</p>
      </div>
    </div>
  )
}