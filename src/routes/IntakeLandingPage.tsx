import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { Container } from '@/components/layout'
import { getContent } from '@/content'

export function IntakeLandingPage() {
  const content = getContent('en')
  const navigate = useNavigate()
  const { intakeLanding } = content

  const startIntake = () => {
    const intakeId = crypto.randomUUID()
    navigate(`/intake/${intakeId}`)
  }

  return (
    <Container size="md" className="py-8 sm:py-10">
      <div className="space-y-6">
        {/* Introduction */}
        <section
          aria-labelledby="intake-landing-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cap-primary">
            {content.navigation.mainNav.getHelp}
          </p>
          <div className="mt-3 space-y-4">
            <h1 id="intake-landing-heading">{intakeLanding.heading}</h1>
            <p className="text-lg text-slate-700">{intakeLanding.subheading}</p>
          </div>
        </section>

        {/* Before you begin */}
        <section
          aria-labelledby="intake-before-begin-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="intake-before-begin-heading" className="text-2xl font-bold text-slate-900">
            {intakeLanding.beforeYouBegin.heading}
          </h2>
          <p className="mt-2 text-slate-700">{intakeLanding.beforeYouBegin.description}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
            {intakeLanding.beforeYouBegin.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 border-t border-slate-200 pt-4 text-slate-700">
            {intakeLanding.estimatedTime}
          </p>
        </section>

        {/* Expectations / key points */}
        <section
          aria-labelledby="intake-expectations-heading"
          className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8"
        >
          <h2 id="intake-expectations-heading" className="text-2xl font-bold text-slate-900">
            {content.howWeHelp.expectations.heading}
          </h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>{intakeLanding.keyPoints.isFree}</li>
            <li>{intakeLanding.keyPoints.noDirectPayment}</li>
            <li>{intakeLanding.keyPoints.noGuarantee}</li>
            <li>{intakeLanding.keyPoints.responseFollowUp}</li>
            <li>{intakeLanding.keyPoints.volumeWarning}</li>
          </ul>
        </section>

        {/* Privacy / information notice */}
        <section
          aria-labelledby="intake-privacy-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="intake-privacy-heading" className="text-xl font-bold text-slate-900">
            {content.legal.privacy.heading}
          </h2>
          <p className="mt-2 text-slate-700">{content.legal.privacy.content}</p>
          <p className="mt-3 text-sm text-slate-600">{intakeLanding.dataUse}</p>
        </section>

        {/* Start a new request */}
        <section
          aria-labelledby="intake-start-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="intake-start-heading" className="sr-only">
            {intakeLanding.startCta.label}
          </h2>
          <Button type="button" onClick={startIntake} size="lg" fullWidth>
            {intakeLanding.startCta.label}
          </Button>
        </section>
      </div>
    </Container>
  )
}