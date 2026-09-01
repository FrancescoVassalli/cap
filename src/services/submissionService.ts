import {
  ApiSubmissionService,
  MockSubmissionService,
  SubmissionError,
  makeReferenceId,
} from '@cap/shared'
import type { IntakeSubmissionResult, SubmissionPayload, SubmissionService } from '@cap/shared'

/**
 * Web service adapters.
 *
 * The shared submission contract and its mock/API implementations live in
 * `@cap/shared` and are re-exported here so the web and mobile apps stay
 * aligned. This module keeps the web-only transitions (the email demo adapter)
 * and the web's environment-aware `createSubmissionService` factory local.
 */

export type { SubmissionPayload, SubmissionService }
export { SubmissionError, MockSubmissionService, ApiSubmissionService }

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