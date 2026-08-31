export type IntakeFormErrors = Record<string, string>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ZIP_RE = /^\d{5}$/
const PHONE_RE = /^[\d\s()+.-]{7,}$/

const KNOWN_LANGUAGE_IDS = new Set(['62', '15'])

/**
 * Maps the wire field names posted by the frontend mapper to the stable
 * application field names the UI can bind field errors to (for example the
 * Formik keys in the intake form). Keeping the mapping here means the backend
 * contract stays aligned with the frontend's `fieldErrors` shape.
 */
const FIELD_ERROR_KEYS: Record<string, string> = {
  FirstName: 'firstName',
  LastName: 'lastName',
  EmailAddress: 'email',
  City: 'city',
  PreferredLanguages: 'language',
  PostalCode: 'zipCode',
  HomePhone: 'phone',
}

function firstValue(form: URLSearchParams, key: string): string {
  return (form.get(key) ?? '').trim()
}

/**
 * Validates the URL-encoded EveryAction body the frontend adapter posts.
 * Mirroring the frontend validation rules (required contact fields, email
 * shape, 5-digit ZIP when present, permissive phone shape) keeps field-level
 * behavior consistent between mock mode and the real API.
 */
export function validateIntakeForm(form: URLSearchParams): IntakeFormErrors {
  const errors: IntakeFormErrors = {}

  const firstName = firstValue(form, 'FirstName')
  const lastName = firstValue(form, 'LastName')
  const email = firstValue(form, 'EmailAddress')
  const city = firstValue(form, 'City')
  const language = firstValue(form, 'PreferredLanguages')
  const zipCode = firstValue(form, 'PostalCode')
  const phone = firstValue(form, 'HomePhone')

  if (!firstName) errors[FIELD_ERROR_KEYS.FirstName] = 'First name is required.'
  if (!lastName) errors[FIELD_ERROR_KEYS.LastName] = 'Last name is required.'
  if (!email) errors[FIELD_ERROR_KEYS.EmailAddress] = 'Email address is required.'
  else if (!EMAIL_RE.test(email)) {
    errors[FIELD_ERROR_KEYS.EmailAddress] = 'Enter a valid email address.'
  }
  if (!city) errors[FIELD_ERROR_KEYS.City] = 'City is required.'
  if (!language) errors[FIELD_ERROR_KEYS.PreferredLanguages] = 'Preferred language is required.'
  else if (!KNOWN_LANGUAGE_IDS.has(language)) {
    errors[FIELD_ERROR_KEYS.PreferredLanguages] = 'Preferred language is invalid.'
  }
  if (zipCode && !ZIP_RE.test(zipCode)) {
    errors[FIELD_ERROR_KEYS.PostalCode] = 'ZIP code must be 5 digits.'
  }
  if (phone && !PHONE_RE.test(phone)) {
    errors[FIELD_ERROR_KEYS.HomePhone] = 'Enter a valid phone number.'
  }

  return errors
}