import type { IntakeSubmissionResult } from '@/types/index'

export type SubmissionPayload = {
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
}

export type SubmissionService = {
  submit: (payload: SubmissionPayload) => Promise<IntakeSubmissionResult>
}

export class MockSubmissionService implements SubmissionService {
  async submit(payload: SubmissionPayload): Promise<IntakeSubmissionResult> {
    await new Promise((resolve) => setTimeout(resolve, 250))

    if (!payload.email || !payload.firstName || !payload.lastName) {
      return {
        success: false,
        message: 'Submission is missing required information.',
      }
    }

    return {
      success: true,
      referenceId: `CAP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      message: 'Your request has been received.',
    }
  }
}
