import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { Button } from '@/components/forms/Button'
import { AppShell } from '@/components/layout/AppShell'
import { getContent } from '@/content'
import { IntakePage, IntakeStartButton } from '@/routes/IntakePage'

const content = getContent('en')

function HowWeHelpPage() {
  const { hero, whatWeHelp, howItWorks, whatWeDont, expectations } = content.howWeHelp

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cap-primary">CAP</p>
        <div className="space-y-4">
          <h1>{hero.title}</h1>
          <p className="max-w-2xl text-lg text-slate-700">{hero.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/intake">
            <Button type="button">{hero.ctaLabel}</Button>
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2>{whatWeHelp.heading}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {whatWeHelp.services.map((service) => (
            <article key={service.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-xl font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-2 text-slate-700">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2>{howItWorks.heading}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {howItWorks.steps.map((step) => (
            <div key={step.stepNumber} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cap-primary">Step {step.stepNumber}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-slate-700">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2>{whatWeDont.heading}</h2>
          <p className="mt-4 text-lg text-slate-700">{whatWeDont.description}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2>{expectations.heading}</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li className="rounded-xl bg-slate-50 p-3">{expectations.responseTime}</li>
            <li className="rounded-xl bg-slate-50 p-3">{expectations.volumeWarning}</li>
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/intake" className="w-full sm:w-auto">
            <Button type="button" className="w-full sm:w-auto">{content.howWeHelp.primaryCta.label}</Button>
          </Link>
          <a
            href={content.howWeHelp.secondaryCta.url}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-cap-primary hover:text-cap-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-primary focus-visible:ring-offset-2"
          >
            {content.howWeHelp.secondaryCta.label}
          </a>
        </div>
      </section>
    </main>
  )
}

function IntakeLandingPage() {
  const navigate = useNavigate()
  const { intakeLanding } = content

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cap-primary">Get help</p>
        <div className="space-y-4">
          <h1>{intakeLanding.heading}</h1>
          <p className="text-lg text-slate-700">{intakeLanding.subheading}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-2xl font-bold text-slate-900">{intakeLanding.beforeYouBegin.heading}</h2>
          <p className="mt-2 text-slate-700">{intakeLanding.beforeYouBegin.description}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
            {intakeLanding.beforeYouBegin.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700">
          <p className="font-medium text-slate-900">{intakeLanding.estimatedTime}</p>
          <p>{intakeLanding.dataUse}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <ul className="space-y-2 text-slate-700">
            <li>{intakeLanding.keyPoints.isFree}</li>
            <li>{intakeLanding.keyPoints.noDirectPayment}</li>
            <li>{intakeLanding.keyPoints.noGuarantee}</li>
            <li>{intakeLanding.keyPoints.responseFollowUp}</li>
            <li>{intakeLanding.keyPoints.volumeWarning}</li>
          </ul>
        </div>

        <IntakeStartButton navigate={navigate} />
      </section>
    </main>
  )
}

const NotFoundPage = () => (
  <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1>We couldn’t find that page.</h1>
      <p className="text-slate-700">The page may have moved or the link may be outdated.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/how-we-help">
          <Button type="button">Go to CAP</Button>
        </Link>
        <Link to="/intake">
          <Button type="button" variant="outline">Get Help</Button>
        </Link>
      </div>
    </div>
  </main>
)

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
