import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HowWeHelpPage } from '@/routes/HowWeHelpPage'

function renderHowWeHelpPage() {
  return render(
    <MemoryRouter initialEntries={['/how-we-help']}>
      <Routes>
        <Route path="/how-we-help" element={<HowWeHelpPage />} />
        <Route path="/intake" element={<div>Intake destination</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('HowWeHelpPage', () => {
  it('answers whether the visitor is in the right place with the approved page structure', () => {
    renderHowWeHelpPage()

    expect(
      screen.getByRole('heading', { name: /get free help with health care bills and insurance/i })
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /what we help with/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /insurance claim denials/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /medical bills/i })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /how cap works/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tell Us What Is Happening' })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /what cap does not do/i })).toBeInTheDocument()
    expect(screen.getByText(/we do not directly pay medical bills/i)).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /what to expect/i })).toBeInTheDocument()
    expect(screen.getByText(/generally follow up within five business days/i)).toBeInTheDocument()
    expect(screen.getByText(/periods of high volume/i)).toBeInTheDocument()
  })

  it('takes the visitor to the intake landing page from the primary CTA', async () => {
    const user = userEvent.setup()
    renderHowWeHelpPage()

    await user.click(screen.getAllByRole('button', { name: /get help/i })[0])

    expect(screen.getByText('Intake destination')).toBeInTheDocument()
  })
})