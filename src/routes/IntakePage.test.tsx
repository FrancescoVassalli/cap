import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { isValidIntakeId } from './intakeId'
import { IntakePage } from './IntakePage'

const INTAKE_ID = '123e4567-e89b-42d3-a456-426614174000'

function renderIntakeRoute(id: string) {
  render(
    <MemoryRouter initialEntries={[`/intake/${id}`]}>
      <Routes>
        <Route path="/intake" element={<div>Intake landing destination</div>} />
        <Route path="/intake/:id" element={<IntakePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('IntakePage', () => {
  it('accepts only UUIDv4-shaped intake ids', () => {
    expect(isValidIntakeId(INTAKE_ID)).toBe(true)
    expect(isValidIntakeId('test-intake')).toBe(false)
    expect(isValidIntakeId(undefined)).toBe(false)
  })

  it('redirects a malformed intake id to the landing page', () => {
    renderIntakeRoute('test-intake')

    expect(screen.getByText('Intake landing destination')).toBeInTheDocument()
  })

  it('renders the intake form for a valid intake id', () => {
    renderIntakeRoute(INTAKE_ID)

    expect(
      screen.getByRole('heading', { name: /what zip code do you live in\?/i }),
    ).toBeInTheDocument()
  })
})
