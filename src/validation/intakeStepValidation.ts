import type { AllContent } from '@/content'
import type { IntakeFormValues } from '@/types/index'
import { PHONE_NUMBER_RE } from './intakeSchema'

export type IntakeFieldErrors = Partial<Record<keyof IntakeFormValues, string>>

export const INTAKE_STEP_FIELDS: Record<number, Array<keyof IntakeFormValues>> = {
  0: ['zipCode'],
  1: ['language'],
  2: ['firstName', 'lastName', 'email', 'phone', 'streetAddress', 'apartment', 'city', 'state'],
  3: [],
}

export function validateIntakeStep(
  step: number,
  values: IntakeFormValues,
  content: AllContent,
): IntakeFieldErrors {
  const errors: IntakeFieldErrors = {}
  const errorMessages = content.intakeForm.errors

  if (step === 0) {
    const cleanZip = values.zipCode.trim()
    if (cleanZip && !/^\d{5}$/.test(cleanZip)) {
      errors.zipCode = errorMessages.zipMustBeFiveDigits
    }
  }

  if (step === 1 && !values.language) {
    errors.language = errorMessages.selectLanguage
  }

  if (step === 2) {
    if (!values.firstName.trim()) {
      errors.firstName = errorMessages.required
    }
    if (!values.lastName.trim()) {
      errors.lastName = errorMessages.required
    }
    if (!values.email.trim()) {
      errors.email = errorMessages.required
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = errorMessages.invalidEmail
    }
    if (values.phone.trim() && !PHONE_NUMBER_RE.test(values.phone.trim())) {
      errors.phone = errorMessages.invalidPhone
    }
    if (!values.streetAddress.trim()) {
      errors.streetAddress = errorMessages.required
    }
    if (!values.city.trim()) {
      errors.city = errorMessages.required
    }
    if (!values.state.trim()) {
      errors.state = errorMessages.required
    }
  }

  return errors
}