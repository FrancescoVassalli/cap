import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { Container } from '@/components/layout'
import { getContent } from '@/content'

export function HowWeHelpPage() {
  const content = getContent('en')
  const navigate = useNavigate()
  const { hero, whatWeHelp, howItWorks, whatWeDont, expectations, primaryCta, secondaryCta } =
    content.howWeHelp

  return (
    <Container size="xl" className="py-8 sm:py-10">
      {/* Hero */}
      <section
        aria-labelledby="how-we-help-hero-heading"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cap-primary">{content.navigation.brand}</p>
        <div className="space-y-4">
          <h1 id="how-we-help-hero-heading">{hero.title}</h1>
          <p className="max-w-2xl text-lg text-slate-700">{hero.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" onClick={() => navigate('/intake')}>
            {hero.ctaLabel}
          </Button>
        </div>
      </section>

      {/* What We Help With */}
      <section
        aria-labelledby="what-we-help-heading"
        className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 id="what-we-help-heading" className="text-2xl font-bold text-slate-900">
          {whatWeHelp.heading}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {whatWeHelp.services.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="text-xl font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-2 text-slate-700">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How CAP Works */}
      <section
        aria-labelledby="how-cap-works-heading"
        className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 id="how-cap-works-heading" className="text-2xl font-bold text-slate-900">
          {howItWorks.heading}
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {howItWorks.steps.map((step) => (
            <li key={step.stepNumber} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cap-primary">
                {content.howWeHelp.howItWorks.stepLabel(step.stepNumber)}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-slate-700">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* What CAP Doesn't Do + Expectations */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="what-we-dont-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="what-we-dont-heading" className="text-2xl font-bold text-slate-900">
            {whatWeDont.heading}
          </h2>
          <p className="mt-4 text-lg text-slate-700">{whatWeDont.description}</p>
        </section>

        <section
          aria-labelledby="expectations-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="expectations-heading" className="text-2xl font-bold text-slate-900">
            {expectations.heading}
          </h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li className="rounded-xl bg-slate-50 p-3">{expectations.responseTime}</li>
            <li className="rounded-xl bg-slate-50 p-3">{expectations.volumeWarning}</li>
          </ul>
        </section>
      </div>

      {/* Next-step CTA */}
      <section
        aria-labelledby="next-steps-heading"
        className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 id="next-steps-heading" className="sr-only">
          {primaryCta.label}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" onClick={() => navigate('/intake')} size="lg">
            {primaryCta.label}
          </Button>
          <a
            href={secondaryCta.url}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-cap-primary hover:text-cap-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-primary focus-visible:ring-offset-2"
          >
{secondaryCta.label}
          </a>
        </div>
      </section>
    </Container>
  )
}

