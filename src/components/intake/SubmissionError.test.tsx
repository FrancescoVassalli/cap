import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SubmissionError } from './SubmissionError'

function renderSubmissionError(kind: 'error' | 'networkError' | 'sessionExpired', onRetry = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/intake/current']}>
      <Routes>
        <Route
          path="/intake/current"
          element={<SubmissionError language="en" kind={kind} onRetry={onRetry} />}
        />
        <Route path="/intake" element={<div>Intake landing destination</div>} />
      </Routes>
    </MemoryRouter>,
  )

  return onRetry
}

describe('SubmissionError', () => {
  it('shows the session-expired message with a new-request action only', async () => {
    const user = userEvent.setup()
    renderSubmissionError('sessionExpired')

    const heading = screen.getByRole('heading', {
      name: /this request is no longer active/i,
    })
    expect(heading).toHaveFocus()
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /start a new request/i }))
    expect(screen.getByText('Intake landing destination')).toBeInTheDocument()
  })

  it('offers retry and contact actions for a generic error without nesting a button in a link', () => {
    renderSubmissionError('error')

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /contact cap/i })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('offers retry without the contact action for a network error', () => {
    renderSubmissionError('networkError')

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /contact cap/i })).not.toBeInTheDocument()
  })

  it('calls the retry handler', async () => {
    const user = userEvent.setup()
    const onRetry = renderSubmissionError('networkError')

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
