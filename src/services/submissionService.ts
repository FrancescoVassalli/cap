import type { IntakeDocument, IntakeSubmissionResult, SubmissionErrorKind } from '@/types/index'
import { buildEveryActionMeta, buildUrlEncoded, toEveryActionBody } from './everyActionMapper'

/**
 * The data required to create an intake submission.
 *
 * This is the application-level payload that the form layer produces. It does
 * not include API-specific concerns (tokens, case IDs) which belong inside the
 * adapters.
 */
export type SubmissionPayload = {
  intakeId: string
  zipCode?: string
  language: 'en' | 'es'
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

/**
 * The submission service contract. The form only depends on this interface; the
 * concrete adapter (mock / email / API) can be swapped without touching the UI.
 */
export type SubmissionService = {
  submit: (payload: SubmissionPayload) => Promise<IntakeSubmissionResult>
}

/**
 * Signals that a submission could not be completed, carrying a discriminated
 * kind so callers can map to the appropriate user-facing copy without exposing
 * raw exceptions or technical details.
 */
export class SubmissionError extends Error {
  readonly kind: SubmissionErrorKind

  constructor(kind: SubmissionErrorKind, message?: string) {
    super(message ?? 'Submission failed.')
    this.name = 'SubmissionError'
    this.kind = kind
  }
}

function makeReferenceId(): string {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CAP-${segment()}-${segment()}`
}

/**
 * Local mock used for the static prototype and tests. Simulates an async
 * round-trip and returns a stable reference number. It never transmits data.
 */
export class MockSubmissionService implements SubmissionService {
  async submit(payload: SubmissionPayload): Promise<IntakeSubmissionResult> {
    await new Promise((resolve) => setTimeout(resolve, 150))

    if (!payload.email || !payload.firstName || !payload.lastName) {
      return {
        success: false,
        errorKind: 'error',
        message: 'Submission is missing required information.',
      }
    }

    return {
      success: true,
      referenceId: makeReferenceId(),
      message: 'Your request has been received.',
    }
  }
}

/**
 * Email-based adapter intended for development/demo only.
 *
 * Per the implementation guide, this is a transitional mechanism. It must NOT
 * include documents or sensitive narrative in a mailto: URL. It builds a
 * deliberately limited notification and would hand it to a reviewed email
 * transport in a real environment. Here it returns a success result without
 * actually sending anything over an unreviewed channel.
 */
export class EmailSubmissionService implements SubmissionService {
  private readonly recipient: string

  constructor(recipient: string) {
    this.recipient = recipient
  }

  async submit(payload: SubmissionPayload): Promise<IntakeSubmissionResult> {
    // Intentionally limited: notify a case-manager inbox, never attach PHI.
    const truncated = `New CAP intake received. Intake ID: ${payload.intakeId} for ${payload.firstName} ${payload.lastName}.`
    const subject = encodeURIComponent(`New CAP intake ${payload.intakeId}`)
    const body = encodeURIComponent(truncated)

    // This looks like composing an email, but no sensitive document data is
    // placed in the URL. In production this would POST to a reviewed transport.
    void `mailto:${this.recipient}?subject=${subject}&body=${body}`

    await new Promise((resolve) => setTimeout(resolve, 200))

    return {
      success: true,
      referenceId: makeReferenceId(),
      message: 'Your request has been received.',
    }
  }
}

/**
 * Production-shaped adapter that maps the application payload to the EveryAction
 * endpoint contract. It builds the flat, URL-encoded body through the pure
 * `everyActionMapper` (which owns every field name, language id, and request
 * metadata) so those concerns stay out of the UI and this adapter only handles
 * transport. It establishes the request/response shape and idempotency behavior
 * (Intake-ID header) so the UI does not need to change when the backend lands.
 *
 * Configuration (base URL) is read at construction and never shipped as a
 * server secret into the bundle.
 */
export class ApiSubmissionService implements SubmissionService {
  private readonly baseUrl: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  async submit(payload: SubmissionPayload): Promise<IntakeSubmissionResult> {
    if (!this.baseUrl) {
      throw new SubmissionError(
        'error',
        'Submission API is not configured for the static prototype.',
      )
    }

    const meta = buildEveryActionMeta({}, typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    const body = buildUrlEncoded(toEveryActionBody(payload, meta))

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}/intakes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Idempotency-Key': payload.intakeId,
        },
        body,
      })
    } catch {
      throw new SubmissionError('networkError', 'Could not connect to the service.')
    }

    if (response.status === 401 || response.status === 403) {
      throw new SubmissionError('sessionExpired', 'This intake session has expired.')
    }

    const data = (await response.json().catch(() => ({}))) as {
      referenceId?: string
      errors?: Record<string, string>
    }

    if (!response.ok) {
      if (data.errors && Object.keys(data.errors).length > 0) {
        return { success: false, errorKind: 'error', fieldErrors: data.errors }
      }
      throw new SubmissionError('error', 'The service could not complete the request.')
    }

    return {
      success: true,
      referenceId: data.referenceId || makeReferenceId(),
      message: 'Your request has been received.',
    }
  }
}

/**
 * Creates the submission adapter configured for the current environment.
 * For the static prototype the default is the in-memory mock; the mode can be
 * selected explicitly where a real backend is expected.
 */
export function createSubmissionService(
  mode: 'mock' | 'email' | 'api' = 'mock',
  options?: { recipient?: string; baseUrl?: string },
): SubmissionService {
  switch (mode) {
    case 'email':
      return new EmailSubmissionService(options?.recipient ?? '')
    case 'api':
      return new ApiSubmissionService(options?.baseUrl)
    case 'mock':
    default:
      return new MockSubmissionService()
  }
}
