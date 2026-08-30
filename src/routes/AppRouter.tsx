import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { RouteFocus } from '@/components/navigation'
import { HowWeHelpPage } from '@/routes/HowWeHelpPage'
import { IntakeLandingPage } from '@/routes/IntakeLandingPage'
import { IntakePage } from '@/routes/IntakePage'
import { NotFoundPage } from '@/routes/NotFoundPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <RouteFocus />
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