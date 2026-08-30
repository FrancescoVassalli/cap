import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'
import { getContent } from '@/content'

function renderShell(initialEntry = '/how-we-help') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <main id="main-content">
          <h1>Page heading</h1>
        </main>
      </AppShell>
    </MemoryRouter>,
  )
}

describe('AppShell navigation', () => {
  it('provides a skip link to the main content landmark', () => {
    renderShell()

    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('brands the header with a home link that uses the full program name', () => {
    renderShell()

    const content = getContent('en')
    expect(screen.getByRole('link', { name: content.navigation.logo.alt })).toHaveAttribute(
      'href',
      '/how-we-help',
    )
  })

  it('renders the main navigation with links to both public destinations', () => {
    renderShell()

    const mainNav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(mainNav).getByRole('link', { name: /how we help/i })).toHaveAttribute(
      'href',
      '/how-we-help',
    )
    expect(within(mainNav).getByRole('link', { name: /get help/i })).toHaveAttribute(
      'href',
      '/intake',
    )
  })

  it('marks the current page in the main navigation', () => {
    renderShell('/intake')

    const mainNav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(mainNav).getByRole('link', { name: /get help/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(mainNav).getByRole('link', { name: /how we help/i })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('keeps the navigation visible on small screens without a hidden menu', () => {
    renderShell()

    const mainNav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(mainNav).toBeVisible()
  })

  it('renders a footer with linked destinations, disclaimer, and copyright', () => {
    renderShell()

    const content = getContent('en')
    const footer = screen.getByRole('contentinfo')
    const footerNav = within(footer).getByRole('navigation', { name: /footer navigation/i })

    expect(within(footerNav).getByRole('link', { name: /how we help/i })).toHaveAttribute(
      'href',
      '/how-we-help',
    )
    expect(within(footerNav).getByRole('link', { name: /get help/i })).toHaveAttribute(
      'href',
      '/intake',
    )
    expect(within(footer).getByText(content.legal.disclaimer.content)).toBeInTheDocument()
    expect(within(footer).getByText(content.navigation.footer.copyright)).toBeInTheDocument()
  })
})