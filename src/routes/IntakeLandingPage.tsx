import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { getContent } from '@/content'

const content = getContent('en')

export function IntakeLandingPage() {
  const navigate = useNavigate()
  const { intakeLanding } = content

  const startIntake = () => {
    const intakeId = crypto.randomUUID()
    navigate(`/intake/${intakeId}`)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <section
        aria-labelledby="intake-landing-heading"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cap-primary">
          {content.navigation.mainNav.getHelp}
        </p>

        {/* Introduction */}
        <div className="space-y-4">
          <h1 id="intake-landing-heading">{intakeLanding.heading}</h1>
          <p className="text-lg text-slate-700">{intakeLanding.subheading}</p>
        </div>

        {/* What you'll need */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-2xl font-bold text-slate-900">
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
        </div>

        {/* Trust and eligibility expectations */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <ul className="space-y-2 text-slate-700">
            <li>{intakeLanding.keyPoints.isFree}</li>
            <li>{intakeLanding.keyPoints.noDirectPayment}</li>
            <li>{intakeLanding.keyPoints.noGuarantee}</li>
            <li>{intakeLanding.keyPoints.responseFollowUp}</li>
            <li>{intakeLanding.keyPoints.volumeWarning}</li>
          </ul>
        </div>

        {/* Privacy / information notice */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-xl font-bold text-slate-900">{content.legal.privacy.heading}</h2>
          <p className="mt-2 text-slate-700">{content.legal.privacy.content}</p>
        </div>

        {/* Start new request */}
        <Button type="button" onClick={startIntake} size="lg" fullWidth>
          {intakeLanding.startCta.label}
        </Button>
      </section>
    </div>
  )
}