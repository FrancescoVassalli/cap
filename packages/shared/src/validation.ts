/**
 * Shared intake validation rules.
 *
 * These derive from the web app's authoritative validation in
 * `src/validation/intakeSchema.ts` and `intakeStepValidation.ts`, but are made
 * transport-neutral: they accept a `messages` object of already-resolved copy
 * so the rule itself is shared while the localized wording stays in the
 * platform's content layer.
 */

import type { IntakeFormValues, IntakeDocument } from './types'

export const PHONE_NUMBER_RE = /^[\d\s()+.-]{7,}$/
export const ZIP_CODE_RE = /^\d{5}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The set of fields considered by each intake step (mirrors web step layout). */
export const INTAKE_STEP_FIELDS: Record<number, Array<keyof IntakeFormValues>> = {
  0: ['zipCode'],
  1: ['language'],
  2: ['firstName', 'lastName', 'email', 'phone', 'streetAddress', 'apartment', 'city', 'state'],
  3: ['documents'],
  4: [],
  5: ['firstName', 'lastName', 'email', 'phone', 'streetAddress', 'apartment', 'city', 'state'],
}

/** Resolved, localized validation messages supplied by the platform content layer. */
export type ValidationMessages = {
  required: string
  invalidEmail: string
  invalidPhone: string
  zipMustBeFiveDigits: string
  selectLanguage: string
  invalidFileType: string
  fileTooLarge: string
  totalSizeTooLarge: string
  duplicateFile: string
}

export type IntakeFieldErrors = Partial<Record<keyof IntakeFormValues, string>>

/** Validates a single step of the intake flow against shared rules. */
export function validateIntakeStep(
  step: number,
  values: IntakeFormValues,
  messages: ValidationMessages,
): IntakeFieldErrors {
  const errors: IntakeFieldErrors = {}

  if (step === 0) {
    const cleanZip = values.zipCode.trim()
    if (cleanZip && !ZIP_CODE_RE.test(cleanZip)) {
      errors.zipCode = messages.zipMustBeFiveDigits
    }
  }

  if (step === 1 && !values.language) {
    errors.language = messages.selectLanguage
  }

  if (step === 2 || step === 5) {
    if (!values.firstName.trim()) errors.firstName = messages.required
    if (!values.lastName.trim()) errors.lastName = messages.required
    if (!values.email.trim()) errors.email = messages.required
    else if (!EMAIL_RE.test(values.email.trim())) errors.email = messages.invalidEmail
    if (values.phone.trim() && !PHONE_NUMBER_RE.test(values.phone.trim())) {
      errors.phone = messages.invalidPhone
    }
    if (!values.streetAddress.trim()) errors.streetAddress = messages.required
    if (!values.city.trim()) errors.city = messages.required
    if (!values.state.trim()) errors.state = messages.required
  }

  return errors
}

export const DOCUMENT_CONFIG = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxTotalSizeBytes: 50 * 1024 * 1024,
  acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] as string[],
  acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'] as string[],
} as const

export type DocumentCandidate = {
  name: string
  size: number
  type: string
}

export type DocumentValidationResult = {
  accepted: DocumentCandidate[]
  errors: string[]
}

function getFileExtension(name: string): string {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex === -1) return ''
  return name.slice(dotIndex).toLowerCase()
}

/**
 * Validates a batch of document candidates against the shared per-file, total,
 * type, and duplicate rules. Duplicate detection uses name+size as a stable key
 * (never the storage id, which is not a security boundary).
 */
export function validateDocumentCandidates(
  files: DocumentCandidate[],
  existingDocuments: IntakeDocument[],
  messages: ValidationMessages,
): DocumentValidationResult {
  const accepted: DocumentCandidate[] = []
  const errors: string[] = []
  const existingKeys = new Set(existingDocuments.map((d) => `${d.name}-${d.size}`))
  const batchKeys = new Set<string>()
  let totalSize = existingDocuments.reduce((sum, d) => sum + d.size, 0)

  for (const file of files) {
    const extension = getFileExtension(file.name)
    const isAllowedType =
      DOCUMENT_CONFIG.acceptedMimeTypes.includes(file.type) ||
      DOCUMENT_CONFIG.acceptedExtensions.includes(extension)

    if (!isAllowedType) {
      errors.push(messages.invalidFileType)
      continue
    }
    if (file.size > DOCUMENT_CONFIG.maxFileSizeBytes) {
      errors.push(messages.fileTooLarge)
      continue
    }
    const key = `${file.name}-${file.size}`
    if (existingKeys.has(key) || batchKeys.has(key)) {
      errors.push(messages.duplicateFile)
      continue
    }
    if (totalSize + file.size > DOCUMENT_CONFIG.maxTotalSizeBytes) {
      errors.push(messages.totalSizeTooLarge)
      continue
    }
    batchKeys.add(key)
    totalSize += file.size
    accepted.push(file)
  }

  return { accepted, errors }
}
