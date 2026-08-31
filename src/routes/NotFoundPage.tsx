import { Link } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { Container } from '@/components/layout'
import { getContent } from '@/content'

export function NotFoundPage() {
  const content = getContent('en')
  const { notFound } = content

  return (
    <Container size="sm" className="py-10 sm:py-16">
      <div className="rounded-2xl border border-cap-secondary/40 bg-white p-6 shadow-sm sm:p-8">
        <h1>{notFound.heading}</h1>
        <p className="mt-3 text-slate-700">{notFound.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/how-we-help">
            <Button type="button">{notFound.goToCapLabel}</Button>
          </Link>
          <Link to="/intake">
            <Button type="button" variant="outline">
              {notFound.getHelpLabel}
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  )
}