import { Link } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { getContent } from '@/content'

interface SubmissionErrorProps {
  language: 'en' | 'es'
  kind: 'error' | 'networkError'
  onRetry: () => void
}

export function SubmissionError({ language, kind, onRetry }: SubmissionErrorProps) {
  const content = getContent(language)
  const errorContent = kind === 'networkError' ? content.submission.networkError : content.submission.error

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-4 text-3xl font-bold text-status-error">{errorContent.heading}</h1>
        <p className="mb-6 text-base text-slate-700">{errorContent.message}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button type="button" onClick={onRetry}>
            {errorContent.retryLabel}
          </Button>
          {kind === 'error' && (
            <Link to="/intake">
              <Button type="button" variant="outline">
                {content.submission.error.contactLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}