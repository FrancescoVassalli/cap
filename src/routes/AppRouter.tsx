import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'

import { Button } from '@/components/forms/Button'
import { AppShell } from '@/components/layout/AppShell'
import { getContent } from '@/content'
import { HowWeHelpPage } from '@/routes/HowWeHelpPage'
import { IntakeLandingPage } from '@/routes/IntakeLandingPage'
import { IntakePage } from '@/routes/IntakePage'

export function NotFoundPage() {
  const content = getContent('en')
  const { notFound } = content

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1>{notFound.heading}</h1>
        <p className="text-slate-700">{notFound.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/how-we-help">
            <Button type="button">{notFound.goToCapLabel}</Button>
          </Link>
          <Link to="/intake">
            <Button type="button" variant="outline">
              {notFound.getHelpLabel}
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

