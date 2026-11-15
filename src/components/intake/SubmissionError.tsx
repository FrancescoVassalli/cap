import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { getContent } from '@/content'
import type { SubmissionErrorKind } from '@/types/index'

interface SubmissionErrorProps {
  language: 'en' | 'es'
  kind: SubmissionErrorKind
  onRetry: () => void
  isLoading?: boolean
}

export function SubmissionError({
  language,
  kind,
  onRetry,
  isLoading = false,
}: SubmissionErrorProps) {
  const content = getContent(language)
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorContent =
    kind === 'sessionExpired'
      ? content.submission.sessionExpired
      : kind === 'networkError'
        ? content.submission.networkError
        : content.submission.error

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div role="alert" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-cap-secondary/40 bg-white p-6 shadow-sm sm:p-8">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mb-4 text-3xl font-bold text-status-error focus:outline-none focus:ring-2 focus:ring-status-error focus:ring-offset-2"
        >
          {errorContent.heading}
        </h1>
        <p className="mb-6 text-base text-slate-700">{errorContent.message}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {kind === 'sessionExpired' ? (
            <Button type="button" onClick={() => navigate('/intake')}>
              {content.submission.sessionExpired.newRequestLabel}
            </Button>
          ) : (
            <>
              <Button type="button" onClick={onRetry} disabled={isLoading}>
                {kind === 'networkError'
                  ? content.submission.networkError.retryLabel
                  : content.submission.error.retryLabel}
              </Button>
              {kind === 'error' && (
                <Button type="button" variant="outline" onClick={() => navigate('/intake')}>
                  {content.submission.error.contactLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
