import { useEffect, useRef } from 'react'
import { getContent } from '@/content'

interface SubmissionSuccessProps {
  language: 'en' | 'es'
  referenceId: string
}

export function SubmissionSuccess({ language, referenceId }: SubmissionSuccessProps) {
  const content = getContent(language)
  const { success } = content.submission
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div role="status" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-cap-secondary/40 bg-white shadow-sm">
        <div className="border-b-4 border-cap-highlight" />
        <div className="p-6 sm:p-8">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mb-4 text-3xl font-bold text-cap-primary focus:outline-none focus:ring-2 focus:ring-cap-primary focus:ring-offset-2"
          >
            {success.heading}
          </h1>
          <p className="mb-4 text-base text-slate-700">{success.message}</p>
          <p className="mb-6 text-slate-700">{success.nextSteps}</p>

          <div className="rounded-xl border-l-4 border-cap-primary bg-cap-primary-50 p-4">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">
              {success.referenceNumberLabel}
            </p>
            <p className="mt-2 text-2xl font-bold text-cap-primary">{referenceId}</p>
          </div>

          <p className="mt-6 text-sm text-slate-600">{success.contactInfoReminder}</p>
        </div>
      </div>
    </div>
  )
}