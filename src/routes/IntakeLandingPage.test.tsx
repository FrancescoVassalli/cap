import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { IntakeLandingPage } from '@/routes/IntakeLandingPage'

function renderIntakeLandingPage() {
  return render(
    <MemoryRouter initialEntries={['/intake']}>
      <Routes>
        <Route path="/intake" element={<IntakeLandingPage />} />
        <Route path="/intake/:id" element={<div>Intake form destination</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('IntakeLandingPage', () => {
  it('orients the visitor with what they need and what to expect', () => {
    renderIntakeLandingPage()

    expect(
      screen.getByRole('heading', { name: /need help with a health care bill or insurance issue\?/i })
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /before you begin/i })).toBeInTheDocument()
    expect(screen.getByText(/your contact information/i)).toBeInTheDocument()
    expect(screen.getByText(/approximately 10-15 minutes/i)).toBeInTheDocument()

    expect(screen.getByText(/CAP is free\./i)).toBeInTheDocument()
    expect(screen.getByText(/we do not directly pay medical bills/i)).toBeInTheDocument()
    expect(screen.getByText(/does not guarantee that CAP can take your case/i)).toBeInTheDocument()
  })

  it('shows an explicit privacy / information notice', () => {
    renderIntakeLandingPage()

    expect(screen.getByRole('heading', { name: /privacy/i })).toBeInTheDocument()
    expect(screen.getByText(/handled according to our privacy policy/i)).toBeInTheDocument()
  })

  it('starts a new request at /intake/:id without storing anything', async () => {
    const user = userEvent.setup()
    renderIntakeLandingPage()

    await user.click(screen.getByRole('button', { name: /start a new request/i }))

    expect(screen.getByText('Intake form destination')).toBeInTheDocument()
  })
})