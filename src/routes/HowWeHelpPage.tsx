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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cap-primary via-cap-primary to-cap-secondary p-6 text-white shadow-lg sm:p-8 lg:p-12"
      >
        <p className="inline-block rounded-full bg-cap-highlight px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-cap-primary">
          {content.navigation.brand}
        </p>
        <div className="mt-4 max-w-2xl space-y-4">
          <h1 id="how-we-help-hero-heading" className="!text-white">
            {hero.title}
          </h1>
          <p className="max-w-2xl text-lg text-cap-secondary-50 sm:text-xl">{hero.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" variant="highlight" size="lg" onClick={() => navigate('/intake')}>
            {hero.ctaLabel}
          </Button>
        </div>
      </section>

      {/* Hero image accent */}
      <img
        src="/cchi-help-2.jpg"
        alt=""
        className="mt-8 h-40 w-full rounded-2xl border border-cap-secondary/40 object-cover object-center shadow-sm sm:h-64"
      />

      {/* What We Help With */}
      <section
        aria-labelledby="what-we-help-heading"
        className="mt-8 overflow-hidden rounded-3xl border border-cap-secondary/40 bg-white shadow-sm"
      >
        <div className="border-b border-cap-secondary/40 bg-cap-secondary-50 px-6 py-4 sm:px-8">
          <h2 id="what-we-help-heading" className="text-2xl font-bold text-cap-primary">
            {whatWeHelp.heading}
          </h2>
        </div>
        <div className="grid gap-4 p-6 sm:p-8 md:grid-cols-2">
          {whatWeHelp.services.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border-l-4 border-cap-primary border border-slate-200 bg-cap-primary-50/60 p-5"
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
        className="mt-8 overflow-hidden rounded-3xl border border-cap-secondary/40 bg-white shadow-sm"
      >
        <div className="border-b border-cap-secondary/40 bg-cap-secondary-50 px-6 py-4 sm:px-8">
          <h2 id="how-cap-works-heading" className="text-2xl font-bold text-cap-primary">
            {howItWorks.heading}
          </h2>
        </div>
        <ol className="grid gap-4 p-6 sm:p-8 md:grid-cols-2">
          {howItWorks.steps.map((step) => (
            <li
              key={step.stepNumber}
              className="rounded-2xl border border-slate-200 bg-cap-primary-50/60 p-5"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cap-highlight text-cap-primary"
              >
                <span className="text-sm font-bold">{step.stepNumber}</span>
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-cap-primary">
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
          className="rounded-3xl border border-cap-secondary/40 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="what-we-dont-heading" className="text-2xl font-bold text-cap-primary">
            {whatWeDont.heading}
          </h2>
          <p className="mt-4 text-lg text-slate-700">{whatWeDont.description}</p>
        </section>

        <section
          aria-labelledby="expectations-heading"
          className="rounded-3xl border-2 border-cap-secondary bg-cap-secondary-50 p-6 shadow-sm sm:p-8"
        >
          <h2 id="expectations-heading" className="text-2xl font-bold text-cap-primary">
            {expectations.heading}
          </h2>
          <ul className="mt-4 space-y-3 text-slate-800">
            <li className="rounded-xl border-l-4 border-cap-highlight bg-white p-3">
              {expectations.responseTime}
            </li>
            <li className="rounded-xl border-l-4 border-cap-highlight bg-white p-3">
              {expectations.volumeWarning}
            </li>
          </ul>
        </section>
      </div>

      {/* Team / trust section */}
      <section
        aria-labelledby="trust-heading"
        className="mt-8 overflow-hidden rounded-3xl border border-cap-secondary/40 bg-white shadow-sm"
      >
        <div className="border-b border-cap-secondary/40 bg-cap-secondary-50 px-6 py-4 sm:px-8">
          <h2 id="trust-heading" className="text-2xl font-bold text-cap-primary">
            A Real Team Behind You
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 sm:p-8 lg:grid-cols-5">
          {[
            { src: '/team-stephanie.jpg', name: 'Stephanie' },
            { src: '/team-madi.png', name: 'Madi' },
            { src: '/team-melissa.jpg', name: 'Melissa' },
            { src: '/team-monica.jpg', name: 'Monica' },
            { src: '/team-alejandra.jpg', name: 'Alejandra' },
          ].map((member) => (
            <figure key={member.name} className="flex flex-col items-center text-center">
              <img
                src={member.src}
                alt={`${member.name}, a CAP team member`}
                className="h-20 w-20 rounded-full border-2 border-cap-secondary object-cover"
              />
              <figcaption className="mt-2 text-sm font-semibold text-slate-800">
                {member.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Next-step CTA */}
      <section
        aria-labelledby="next-steps-heading"
        className="mt-8 rounded-3xl border border-cap-secondary/40 bg-cap-primary p-6 shadow-lg sm:p-8"
      >
        <h2 id="next-steps-heading" className="sr-only">
          {primaryCta.label}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="highlight" size="lg" onClick={() => navigate('/intake')}>
            {primaryCta.label}
          </Button>
          <a
            href={secondaryCta.url}
            className="inline-flex items-center justify-center rounded-md border-2 border-white px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-cap-primary"
          >
            {secondaryCta.label}
          </a>
        </div>
      </section>
    </Container>
  )
}

