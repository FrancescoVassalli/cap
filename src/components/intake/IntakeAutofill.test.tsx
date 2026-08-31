import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { IntakeForm } from './IntakeForm'

function renderIntakeForm() {
  return render(
    <MemoryRouter>
      <IntakeForm intakeId="test-intake" />
    </MemoryRouter>,
  )
}

/** Each intake field that should trigger a browser autofill, with its expected
 *  autocomplete token (per the frontend implementation guide §17). */
const AUTOFILL_FIELDS: Array<{ label: RegExp; autocomplete: string }> = [
  { label: /zip code/i, autocomplete: 'postal-code' },
  { label: /first name/i, autocomplete: 'given-name' },
  { label: /last name/i, autocomplete: 'family-name' },
  { label: /email address/i, autocomplete: 'email' },
  { label: /phone/i, autocomplete: 'tel' },
  { label: /street address/i, autocomplete: 'street-address' },
  { label: /apartment/i, autocomplete: 'address-line2' },
  { label: /city/i, autocomplete: 'address-level2' },
  { label: /state/i, autocomplete: 'address-level1' },
]

async function goToContactStep(user: ReturnType<typeof userEvent.setup>) {
  const zip = screen.getByLabelText(/zip code/i)
  await user.clear(zip)
  await user.type(zip, '80203')
  await user.click(screen.getByRole('button', { name: /continue/i }))
  await user.click(screen.getByRole('button', { name: /continue/i }))
}

describe('IntakeForm autofill', () => {
  it('renders the correct browser autocomplete attribute on the ZIP field', () => {
    renderIntakeForm()
    expect(screen.getByLabelText(/zip code/i)).toHaveAttribute(
      'autocomplete',
      'postal-code',
    )
  })

  it('renders the correct browser autocomplete attributes on every contact field', async () => {
    const user = userEvent.setup()
    renderIntakeForm()
    await goToContactStep(user)

    for (const { label, autocomplete } of AUTOFILL_FIELDS) {
      if (autocomplete === 'postal-code') continue // ZIP is on the previous step
      expect(screen.getByLabelText(label)).toHaveAttribute('autocomplete', autocomplete)
    }
  })

  it('autofills city and state from a known ZIP across all derived address fields', async () => {
    const user = userEvent.setup()
    renderIntakeForm()
    await goToContactStep(user)

    expect(screen.getByLabelText(/city/i)).toHaveValue('Denver')
    expect(screen.getByLabelText(/state/i)).toHaveValue('CO')
  })

  it('keeps CITY and STATE editable after ZIP autofill so users can correct them', async () => {
    const user = userEvent.setup()
    renderIntakeForm()
    await goToContactStep(user)

    const city = screen.getByLabelText(/city/i)
    const state = screen.getByLabelText(/state/i)
    await user.clear(city)
    await user.type(city, 'Boulder')
    await user.clear(state)
    await user.type(state, 'CO')

    expect(city).toHaveValue('Boulder')
    expect(state).toHaveValue('CO')
  })

  it('re-runs ZIP autofill after navigating back and changing the ZIP', async () => {
    const user = userEvent.setup()
    renderIntakeForm()
    await goToContactStep(user)
    expect(screen.getByLabelText(/city/i)).toHaveValue('Denver')

    // Navigate back through language to the ZIP step and switch to another known ZIP.
    await user.click(screen.getByRole('button', { name: /back/i }))
    await user.click(screen.getByRole('button', { name: /back/i }))

    const zip = screen.getByLabelText(/zip code/i)
    await user.clear(zip)
    await user.type(zip, '80521')

    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByLabelText(/city/i)).toHaveValue('Fort Collins')
    expect(screen.getByLabelText(/state/i)).toHaveValue('CO')
  })
})
