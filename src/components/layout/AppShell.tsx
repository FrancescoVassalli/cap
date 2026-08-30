import type { PropsWithChildren } from 'react'

import { getContent } from '@/content'

export function AppShell({ children }: PropsWithChildren) {
  const content = getContent('en')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-lg font-bold text-sky-900">{content.navigation.brand}</p>
          </div>
          <nav aria-label={content.navigation.mainNav.ariaLabel} className="flex gap-4 text-sm font-medium text-slate-700">
            <a href="/how-we-help" className="rounded px-2 py-1 hover:text-sky-900">{content.navigation.mainNav.howWeHelp}</a>
            <a href="/intake" className="rounded px-2 py-1 hover:text-sky-900">{content.navigation.mainNav.getHelp}</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-slate-600 sm:px-6 lg:px-8">
          <p>{content.navigation.logo.alt}</p>
          <p>{content.navigation.footer.copyright}</p>
        </div>
      </footer>
    </div>
  )
}

