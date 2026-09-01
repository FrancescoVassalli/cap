/**
 * Web intake step validation.
 *
 * The actual validation rules live in `@cap/shared` so the web and mobile apps
 * enforce identical business rules. This module keeps the web-specific mapping
 * of steps to fields (a UI concern — the web flow has four steps while the
 * mobile flow has more granular steps) and re-exports the shared validator,
 * which is called with the platform's already-resolved message copy.
 */

import { validateIntakeStep as sharedValidateIntakeStep } from '@cap/shared'
import type { IntakeFieldErrors as SharedIntakeFieldErrors, ValidationMessages } from '@cap/shared'
import type { IntakeFormValues } from '@/types/index'

export type IntakeFieldErrors = SharedIntakeFieldErrors

export const INTAKE_STEP_FIELDS: Record<number, Array<keyof IntakeFormValues>> = {
  0: ['zipCode'],
  1: ['language'],
  2: ['firstName', 'lastName', 'email', 'phone', 'streetAddress', 'apartment', 'city', 'state'],
  3: [],
}

/**
 * Validates the active web step against the shared business rules. The web
 * content layer already resolves localized error copy, so callers pass
 * `content.intakeForm.errors` directly.
 */
export function validateIntakeStep(
  step: number,
  values: IntakeFormValues,
  messages: ValidationMessages,
): IntakeFieldErrors {
  return sharedValidateIntakeStep(step, values, messages)
}