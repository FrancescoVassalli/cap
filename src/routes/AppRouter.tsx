import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'

import { Button } from '@/components/forms/Button'
import { AppShell } from '@/components/layout/AppShell'
import { HowWeHelpPage } from '@/routes/HowWeHelpPage'
import { IntakeLandingPage } from '@/routes/IntakeLandingPage'
import { IntakePage } from '@/routes/IntakePage'

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1>We couldn’t find that page.</h1>
        <p className="text-slate-700">The page may have moved or the link may be outdated.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/how-we-help">
            <Button type="button">Go to CAP</Button>
          </Link>
          <Link to="/intake">
            <Button type="button" variant="outline">
              Get Help
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/how-we-help" replace />} />
          <Route path="/how-we-help" element={<HowWeHelpPage />} />
          <Route path="/intake" element={<IntakeLandingPage />} />
          <Route path="/intake/:id" element={<IntakePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}