import type { PropsWithChildren } from 'react'

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-lg font-bold text-sky-900">CAP</p>
          </div>
          <nav aria-label="Main navigation" className="flex gap-4 text-sm font-medium text-slate-700">
            <a href="/how-we-help" className="rounded px-2 py-1 hover:text-sky-900">How We Help</a>
            <a href="/intake" className="rounded px-2 py-1 hover:text-sky-900">Get Help</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600 sm:px-6 lg:px-8">
          Consumer Assistance Program
        </div>
      </footer>
    </div>
  )
}
