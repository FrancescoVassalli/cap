import { render, screen, waitFor } from '@testing-library/react'
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

async function goToContactStep(user: ReturnType<typeof userEvent.setup>) {
  const zip = screen.getByLabelText(/zip code/i)
  await user.clear(zip)
  await user.type(zip, '80203')
  await user.click(screen.getByRole('button', { name: /continue/i }))
  // language step - English is preselected, continue
  await user.click(screen.getByRole('button', { name: /continue/i }))
}

describe('IntakeForm', () => {
  describe('step navigation', () => {
    it('disables Back on the first step and lets the user go back', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      const backButton = () => screen.getByRole('button', { name: /back/i })
      expect(backButton()).toBeDisabled()

      await user.type(screen.getByLabelText(/zip code/i), '80203')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByRole('heading', { name: /preferred language/i })).toBeInTheDocument()
      expect(backButton()).toBeEnabled()

      await user.click(backButton())
      expect(screen.getByRole('heading', { name: /what zip code do you live in\?/i })).toBeInTheDocument()
    })

    it('advances from the ZIP step on Enter instead of submitting early', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '80203{Enter}')

      expect(screen.getByRole('heading', { name: /preferred language/i })).toBeInTheDocument()
    })

    it('shows a step-of-total progress label', async () => {
      const user = userEvent.setup()
      renderIntakeForm()
      expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
      await user.type(screen.getByLabelText(/zip code/i), '80203')
      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument()
    })
  })

  describe('language step', () => {
    it('defaults the language selection to English', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '80203')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      const englishRadio = screen.getByRole('radio', { name: /english/i })
      const spanishRadio = screen.getByRole('radio', { name: /spanish/i })

      expect(englishRadio).toBeChecked()
      expect(spanishRadio).not.toBeChecked()
    })

    it('labels the language options as a group and shows both flags', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '80203')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByRole('group', { name: /preferred language/i })).toBeInTheDocument()
      expect(screen.getByTestId('language-flag-en')).toBeInTheDocument()
      expect(screen.getByTestId('language-flag-es')).toBeInTheDocument()
    })

    it('updates the document language when Spanish is selected', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '80203')
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await user.click(screen.getByRole('radio', { name: /spanish/i }))

      expect(document.documentElement.lang).toBe('es')
    })
  })

  describe('ZIP step', () => {
    it('autofills city and state from a known ZIP while keeping them editable', async () => {
      const user = userEvent.setup()
      renderIntakeForm()
      await goToContactStep(user)

      const city = screen.getByLabelText(/city/i) as HTMLInputElement
      const state = screen.getByLabelText(/state/i) as HTMLInputElement

      expect(city).toHaveValue('Denver')
      expect(state).toHaveValue('CO')

      await user.clear(city)
      await user.type(city, 'Boulder')
      expect(city).toHaveValue('Boulder')
    })

    it('lets the user continue with the ZIP left blank', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      // No "Skip this step" control exists; leaving the ZIP empty and
      // continuing is the supported way to proceed.
      expect(
        screen.queryByRole('button', { name: /skip this step/i }),
      ).not.toBeInTheDocument()

      expect(screen.getByLabelText(/zip code/i)).toHaveValue('')

      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByRole('heading', { name: /preferred language/i })).toBeInTheDocument()
    })

    it('shows a message for an unknown ZIP and still lets the user continue', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '99999')
      expect(screen.getByRole('status')).toHaveTextContent(/couldn't find that zip code/i)

      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByRole('heading', { name: /preferred language/i })).toBeInTheDocument()
    })

    it('clears a previous ZIP autofill when the ZIP becomes unknown', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '80203')
      await user.clear(screen.getByLabelText(/zip code/i))
      await user.type(screen.getByLabelText(/zip code/i), '99999')
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByLabelText(/city/i)).toHaveValue('')
      expect(screen.getByLabelText(/state/i)).toHaveValue('')
    })

    it('clears a previous ZIP autofill when the ZIP is removed', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '80203')
      await user.clear(screen.getByLabelText(/zip code/i))
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByLabelText(/city/i)).toHaveValue('')
      expect(screen.getByLabelText(/state/i)).toHaveValue('')
    })

    it('rejects a non-five-digit ZIP with an accessible error', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '123')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByRole('alert')).toHaveTextContent(/there are issues to fix/i)
      expect(screen.getAllByText(/zip code must be 5 digits/i).length).toBeGreaterThan(0)
      expect(screen.getByLabelText(/zip code/i)).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('contact validation', () => {
    it('shows required-field errors when the contact step is submitted empty', async () => {
      const user = userEvent.setup()
      renderIntakeForm()
      await goToContactStep(user)

      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByRole('alert')).toHaveTextContent(/there are issues to fix/i)
      expect(screen.getByRole('alert')).toHaveTextContent(/first name/i)
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows an invalid email message', async () => {
      const user = userEvent.setup()
      renderIntakeForm()
      await goToContactStep(user)

      await user.type(screen.getByLabelText(/first name/i), 'Avery')
      await user.type(screen.getByLabelText(/last name/i), 'Smith')
      await user.type(screen.getByLabelText(/email address/i), 'not-an-email')
      await user.type(screen.getByLabelText(/street address/i), '123 Main St')
      await user.type(screen.getByLabelText(/city/i), 'Denver')
      await user.type(screen.getByLabelText(/state/i), 'CO')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getAllByText(/enter a valid email address/i).length).toBeGreaterThan(0)
    })
  })

  describe('submission', () => {
    it('shows the content-driven success screen with a reference number', async () => {
      const user = userEvent.setup()
      renderIntakeForm()
      await goToContactStep(user)

      await user.type(screen.getByLabelText(/first name/i), 'Avery')
      await user.type(screen.getByLabelText(/last name/i), 'Smith')
      await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
      await user.type(screen.getByLabelText(/street address/i), '123 Main St')
      await user.type(screen.getByLabelText(/city/i), 'Denver')
      await user.type(screen.getByLabelText(/state/i), 'CO')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      // documents step - skip, then submit
      await user.click(screen.getByRole('button', { name: /submit request/i }))

      const successHeading = await screen.findByRole('heading', { name: /request received/i })
      expect(successHeading).toBeInTheDocument()
      await waitFor(() => expect(successHeading).toHaveFocus())
      expect(screen.getByText(/your reference number is:/i)).toBeInTheDocument()
      expect(screen.getByText(/cap-/i)).toBeInTheDocument()
    })
  })

  describe('no persistence', () => {
    it('keeps all intake state in memory and writes nothing to storage', async () => {
      const user = userEvent.setup()
      renderIntakeForm()

      await user.type(screen.getByLabelText(/zip code/i), '80203')
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await user.type(screen.getByLabelText(/first name/i), 'Avery')

      expect(window.localStorage.length).toBe(0)
      expect(window.sessionStorage.length).toBe(0)
    })
  })
})
