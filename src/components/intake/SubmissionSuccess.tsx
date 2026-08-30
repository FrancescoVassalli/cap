import { getContent } from '@/content'

interface SubmissionSuccessProps {
  language: 'en' | 'es'
  referenceId: string
}

export function SubmissionSuccess({ language, referenceId }: SubmissionSuccessProps) {
  const content = getContent(language)
  const { success } = content.submission

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-4 text-3xl font-bold text-cap-primary">{success.heading}</h1>
        <p className="mb-4 text-base text-slate-700">{success.message}</p>
        <p className="mb-6 text-slate-700">{success.nextSteps}</p>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-600">
            {success.referenceNumberLabel}
          </p>
          <p className="mt-2 text-2xl font-bold text-cap-primary">{referenceId}</p>
        </div>

        <p className="mt-6 text-sm text-slate-600">{success.contactInfoReminder}</p>
      </div>
    </div>
  )
}