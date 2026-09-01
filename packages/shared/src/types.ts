/**
 * Shared CAP intake domain types.
 *
 * This is the single source of truth for the intake model, validation
 * contracts, and submission error taxonomy used by both the web app and the
 * mobile app. Platform-specific concerns (browser File, React Native Asset) are
 * deliberately kept out of this layer — see `IntakeDocument` which uses only
 * serializable metadata.
 */

export type Language = 'en' | 'es'

export type IntakeFormValues = {
  zipCode: string
  language: Language
  firstName: string
  lastName: string
  email: string
  phone: string
  streetAddress: string
  apartment: string
  city: string
  state: string
  documents: IntakeDocument[]
}

/**
 * Serializable metadata for an intake document. The file bytes themselves are
 * handled by platform-specific document handlers and uploaded only through the
 * approved document-upload service; this type never carries content.
 */
export type IntakeDocument = {
  id: string
  name: string
  size: number
  type: string
}

export type ZipLocation = {
  zipCode: string
  city: string
  state: string
  county?: string
}

export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * Discriminates the intent of a failed submission so the UI can choose the
 * correct copy (generic failure vs. network interruption vs. expired session).
 */
export type SubmissionErrorKind = 'error' | 'networkError' | 'sessionExpired'

export type IntakeSubmissionResult = {
  success: boolean
  referenceId?: string
  message?: string
  errorKind?: SubmissionErrorKind
  /**
   * Server-side field validation errors (email, postalCode, etc.). Mapped into
   * Formik once the backend exists.
   */
  fieldErrors?: Record<string, string>
}

/** The application-level payload the form layer produces for a submission. */
export type SubmissionPayload = {
  intakeId: string
  zipCode?: string
  language: Language
  firstName: string
  lastName: string
  email: string
  phone?: string
  streetAddress: string
  apartment?: string
  city: string
  state: string
  documents?: IntakeDocument[]
}
