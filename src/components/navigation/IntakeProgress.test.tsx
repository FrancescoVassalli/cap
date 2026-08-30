import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IntakeProgress } from './IntakeProgress'

describe('IntakeProgress', () => {
  it('announces the current step within a labelled progress group', () => {
    render(<IntakeProgress current={2} total={4} progressText="Step 2 of 4" ariaLabel="Form progress" />)

    const group = screen.getByRole('group', { name: /form progress/i })
    expect(within(group).getByText(/step 2 of 4/i)).toBeInTheDocument()
  })

  it('renders one segment per step and keeps the visual bar hidden from assistive tech', () => {
    const { container } = render(
      <IntakeProgress current={1} total={4} progressText="Step 1 of 4" ariaLabel="Form progress" />,
    )

    const segments = container.querySelectorAll('[aria-hidden="true"] > span')
    expect(segments.length).toBe(4)
  })
})