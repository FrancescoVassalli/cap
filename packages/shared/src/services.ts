/**
 * Shared service contracts for the CAP intake.
 *
 * These are transport-neutral interfaces. The concrete adapters (mock / API /
 * presigned-S3) live on the platform side, but the contracts they implement are
 * shared so the web and mobile app stay aligned around the same submission and
 * upload semantics.
 */

import type {
  IntakeDocument,
  IntakeSubmissionResult,
  SubmissionErrorKind,
  ZipLocation,
} from './types'

/** The application-level payload the form layer produces for a submission. */
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

/** Submission service contract. The form only depends on this interface. */
export type SubmissionService = {
  submit: (payload: SubmissionPayload) => Promise<IntakeSubmissionResult>
}

/** ZIP lookup service contract. */
export type ZipService = {
  lookup: (zip: string) => ZipLocation | null
}

/** Result of a completed document upload. Never carries file bytes. */
export type UploadedDocument = {
  id: string
  name: string
  url: string
}

/** Platform-neutral document reference for upload — the file handle is opaque. */
export type UploadFileHandle = {
  name: string
  size: number
  type: string
  /** Opaque platform handle. On the web this is a File; on native it is an Asset uri. */
  uri?: string
}

/** Document upload service contract. */
export type DocumentUploadService = {
  upload: (file: UploadFileHandle, intakeId: string) => Promise<UploadedDocument>
}

/**
 * Signals a submission failure with a discriminated kind so callers map to
 * user-facing copy without exposing raw exceptions.
 */
export class SubmissionError extends Error {
  readonly kind: SubmissionErrorKind

  constructor(kind: SubmissionErrorKind, message?: string) {
    super(message ?? 'Submission failed.')
    this.name = 'SubmissionError'
    this.kind = kind
  }
}

/** Signals a document upload failure without exposing storage internals. */
export class DocumentUploadError extends Error {
  constructor(message?: string) {
    super(message ?? 'Document upload failed.')
    this.name = 'DocumentUploadError'
  }
}

function makeReferenceId(): string {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CAP-${segment()}-${segment()}`
}

/** Local mock used for the static prototype and tests. Never transmits data. */
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
 * Creates the submission adapter for the current environment. Kept shared so
 * web and mobile resolve the same contract; the concrete adapter is selected
 * by the platform's configuration seam.
 */
export function createSubmissionService(
  mode: 'mock' | 'api' = 'mock',
  options?: { baseUrl?: string },
): SubmissionService {
  if (mode === 'api') {
    return new ApiSubmissionService(options?.baseUrl)
  }
  return new MockSubmissionService()
}

/**
 * Production-shaped adapter mapping the application payload to the backend
 * contract. Kept transport-neutral (uses a `fetch`-like signature via a
 * lightweight request function) so it can run on both web and native.
 */
export class ApiSubmissionService implements SubmissionService {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(baseUrl = '', fetchImpl?: typeof fetch) {
    this.baseUrl = baseUrl
    this.fetchImpl = fetchImpl ?? globalThis.fetch
  }

  async submit(payload: SubmissionPayload): Promise<IntakeSubmissionResult> {
    if (!this.baseUrl) {
      throw new SubmissionError(
        'error',
        'Submission API is not configured for the static prototype.',
      )
    }

    let response: Response
    try {
      response = await this.fetchImpl(`${this.baseUrl}/intakes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': payload.intakeId,
        },
        body: JSON.stringify(payload),
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
