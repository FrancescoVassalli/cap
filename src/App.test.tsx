import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App shell', () => {
  it('renders the CAP landing page hero heading', () => {
    window.history.pushState({}, '', '/how-we-help')
    render(<App />)

    expect(screen.getByRole('heading', { name: /get free help with health care bills and insurance/i })).toBeInTheDocument()
  })

  it('shows the structured how-we-help overview content', () => {
    window.history.pushState({}, '', '/how-we-help')

    render(<App />)

    expect(screen.getByRole('heading', { name: /get free help with health care bills and insurance/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /what we help with/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how cap works/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /what to expect/i })).toBeInTheDocument()
  })

  it('shows the intake landing page guidance before starting a request', async () => {
    window.history.pushState({}, '', '/intake')
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByRole('heading', { name: /need help with a health care bill or insurance issue\?/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /before you begin/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start a new request/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /start a new request/i }))
    expect(screen.getByRole('heading', { name: /what zip code do you live in\?/i })).toBeInTheDocument()
  })

  it('allows a user to complete the intake form', async () => {
    window.history.pushState({}, '', '/intake')
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /start a new request/i }))

    expect(screen.getByRole('heading', { name: /what zip code do you live in\?/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/zip code/i), '123')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getAllByText(/zip code must be 5 digits/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('alert')).toHaveTextContent(/there are issues to fix/i)

    await user.clear(screen.getByLabelText(/zip code/i))
    await user.type(screen.getByLabelText(/zip code/i), '80203')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByRole('heading', { name: /preferred language/i })).toBeInTheDocument()

    await user.click(screen.getByLabelText(/english/i))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getAllByRole('heading', { name: /contact information/i })[0]).toBeInTheDocument()

    await user.type(screen.getByLabelText(/first name/i), 'Avery')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/street address/i), '123 Main St')
    await user.type(screen.getByLabelText(/city/i), 'Denver')
    await user.type(screen.getByLabelText(/state/i), 'CO')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getAllByRole('heading', { name: /documents/i })[0]).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(await screen.findByRole('heading', { name: /request received/i })).toBeInTheDocument()
    expect(screen.getByText(/reference number/i)).toBeInTheDocument()
  })
})
