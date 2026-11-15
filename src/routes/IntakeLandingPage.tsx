import { useNavigate } from 'react-router-dom'
import { generateIntakeId } from '@cap/shared'
import { Button } from '@/components/forms/Button'
import { Container } from '@/components/layout'
import { getContent } from '@/content'

export function IntakeLandingPage() {
  const content = getContent('en')
  const navigate = useNavigate()
  const { intakeLanding } = content

  const startIntake = () => {
    navigate(`/intake/${generateIntakeId()}`)
  }

  return (
    <Container size="md" className="py-8 sm:py-10">
      <div className="space-y-6">
        {/* Introduction */}
        <section
          aria-labelledby="intake-landing-heading"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cap-primary via-cap-primary to-cap-secondary p-6 text-white shadow-lg sm:p-8 lg:p-10"
        >
          <p className="inline-block rounded-full bg-cap-highlight px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-cap-primary">
            {content.navigation.mainNav.getHelp}
          </p>
          <div className="mt-4 space-y-4">
            <h1 id="intake-landing-heading" className="!text-white">
              {intakeLanding.heading}
            </h1>
            <p className="text-lg text-cap-secondary-50 sm:text-xl">{intakeLanding.subheading}</p>
          </div>
        </section>

        {/* Before you begin */}
        <section
          aria-labelledby="intake-before-begin-heading"
          className="overflow-hidden rounded-3xl border border-cap-secondary/40 bg-white shadow-sm"
        >
          <div className="border-b border-cap-secondary/40 bg-cap-secondary-50 px-6 py-4 sm:px-8">
            <h2 id="intake-before-begin-heading" className="text-2xl font-bold text-cap-primary">
              {intakeLanding.beforeYouBegin.heading}
            </h2>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-slate-700">{intakeLanding.beforeYouBegin.description}</p>
            <ul className="mt-4 space-y-2 text-slate-700">
              {intakeLanding.beforeYouBegin.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cap-highlight" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-cap-secondary/40 pt-4 font-medium text-slate-800">
              {intakeLanding.estimatedTime}
            </p>
          </div>
        </section>

        {/* Expectations / key points */}
        <section
          aria-labelledby="intake-expectations-heading"
          className="rounded-3xl border-2 border-cap-secondary bg-cap-secondary-50 p-6 shadow-sm sm:p-8"
        >
          <h2 id="intake-expectations-heading" className="text-2xl font-bold text-cap-primary">
            {content.howWeHelp.expectations.heading}
          </h2>
          <ul className="mt-4 space-y-3 text-slate-800">
            {[
              intakeLanding.keyPoints.isFree,
              intakeLanding.keyPoints.noDirectPayment,
              intakeLanding.keyPoints.noGuarantee,
              intakeLanding.keyPoints.responseFollowUp,
              intakeLanding.keyPoints.volumeWarning,
            ].map((point) => (
              <li key={point} className="rounded-xl border-l-4 border-cap-highlight bg-white p-3">
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Privacy / information notice */}
        <section
          aria-labelledby="intake-privacy-heading"
          className="rounded-3xl border border-cap-secondary/40 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="intake-privacy-heading" className="text-xl font-bold text-cap-primary">
            {content.legal.privacy.heading}
          </h2>
          <p className="mt-2 text-slate-700">{content.legal.privacy.content}</p>
          <p className="mt-3 text-sm text-slate-600">{intakeLanding.dataUse}</p>
        </section>

        {/* Start a new request */}
        <section
          aria-labelledby="intake-start-heading"
          className="rounded-3xl border border-cap-secondary/40 bg-cap-primary p-6 shadow-lg sm:p-8"
        >
          <h2 id="intake-start-heading" className="sr-only">
            {intakeLanding.startCta.label}
          </h2>
          <Button type="button" variant="highlight" size="lg" fullWidth onClick={startIntake}>
            {intakeLanding.startCta.label}
          </Button>
        </section>
      </div>
    </Container>
  )
}