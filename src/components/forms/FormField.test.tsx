import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from './FormField'
import { TextInput } from './TextInput'

describe('FormField', () => {
  it('associates a hint with its input', () => {
    render(
      <FormField label="Email" htmlFor="email" hint="We never share this.">
        <TextInput id="email" name="email" />
      </FormField>,
    )

    const input = screen.getByLabelText(/email/i)
    const hint = screen.getByText(/we never share this/i)

    expect(hint).toHaveAttribute('id')
    expect(input).toHaveAttribute('aria-describedby', hint.id)
  })

  it('associates an error with its input and preserves existing descriptions', () => {
    render(
      <FormField label="Email" htmlFor="email" error="Enter a valid email.">
        <TextInput id="email" name="email" aria-describedby="external-help" />
      </FormField>,
    )

    const input = screen.getByLabelText(/email/i)
    const error = screen.getByText(/enter a valid email/i)

    expect(error).toHaveAttribute('id')
    expect(input).toHaveAttribute('aria-describedby', `external-help ${error.id}`)
  })
})
