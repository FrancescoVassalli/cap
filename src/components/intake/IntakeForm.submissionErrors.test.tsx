import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IntakeForm } from './IntakeForm'

const { submitMock } = vi.hoisted(() => ({ submitMock: vi.fn() }))

vi.mock('@/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services')>()
  return {
    ...actual,
    services: {
      ...actual.services,
      submission: { submit: submitMock },
    },
  }
})

function renderIntakeForm() {
  render(
    <MemoryRouter>
      <IntakeForm intakeId="test-intake" />
    </MemoryRouter>,
  )
}

async function completeIntake(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/zip code/i), '80203')
  await user.click(screen.getByRole('button', { name: /continue/i }))
  await user.click(screen.getByRole('button', { name: /continue/i }))

  await user.type(screen.getByLabelText(/first name/i), 'Avery')
  await user.type(screen.getByLabelText(/last name/i), 'Smith')
  await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
  await user.type(screen.getByLabelText(/street address/i), '123 Main St')
  await user.click(screen.getByRole('button', { name: /continue/i }))
}

describe('IntakeForm submission errors', () => {
  beforeEach(() => {
    submitMock.mockReset()
  })

  it('returns to the contact step and displays server field errors', async () => {
    const user = userEvent.setup()
    submitMock.mockResolvedValueOnce({
      success: false,
      errorKind: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: { email: 'That email is already in use.' },
    })
    renderIntakeForm()

    await completeIntake(user)
    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(
      await screen.findByRole('heading', { level: 1, name: /contact information/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('That email is already in use.')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('retries the same submission from the error screen', async () => {
    const user = userEvent.setup()
    submitMock
      .mockResolvedValueOnce({
        success: false,
        errorKind: 'error',
        message: 'The service is unavailable.',
      })
      .mockResolvedValueOnce({
        success: true,
        referenceId: 'CAP-RETRY',
        message: 'ok',
      })
    renderIntakeForm()

    await completeIntake(user)
    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(
      await screen.findByRole('heading', { name: /we couldn't submit your request/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByRole('heading', { name: /request received/i })).toBeInTheDocument()
    expect(submitMock).toHaveBeenCalledTimes(2)
    expect(submitMock.mock.calls[1][0]).toEqual(submitMock.mock.calls[0][0])
  })
})
