import type { PropsWithChildren } from 'react'
import { FooterNav, MainNav, SiteBrand, SkipLink } from '@/components/navigation'
import { getContent } from '@/content'

export function AppShell({ children }: PropsWithChildren) {
  const content = getContent('en')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <SkipLink label={content.navigation.skipLink.label} />

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <SiteBrand brand={content.navigation.brand} alt={content.navigation.logo.alt} />
          <MainNav
            ariaLabel={content.navigation.mainNav.ariaLabel}
            labels={{
              howWeHelp: content.navigation.mainNav.howWeHelp,
              getHelp: content.navigation.mainNav.getHelp,
            }}
          />
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer aria-label={content.navigation.footer.ariaLabel} className="border-t border-slate-200 bg-white">
        <FooterNav content={content} />
      </footer>
    </div>
  )
}