import { useRef, useState } from 'react'
import { services, SubmissionError, type Services } from '@/services'
import type { IntakeFormValues } from '@/types/index'

export type EveryActionSubmissionValues = {
  intakeId: string
} & Omit<IntakeFormValues, 'documents'> & {
    documents?: IntakeFormValues['documents']
  }

export type EveryActionSubmissionState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  errorKind: 'error' | 'networkError' | 'sessionExpired'
  referenceId: string
  fieldErrors: Record<string, string>
  started: boolean
}

const INITIAL_STATE: EveryActionSubmissionState = {
  status: 'idle',
  errorKind: 'error',
  referenceId: '',
  fieldErrors: {},
  started: false,
}

/**
 * Thin hook that composes the EveryAction data mapper with the existing
 * submission service boundary. The form layer calls a single clean
 * `submit(values)` and never sees EveryAction field names, language ids, URL
 * encoding, or request metadata. The mapper itself is consumed by the
 * `ApiSubmissionService` (the only path that touches EveryAction); the mock and
 * email adapters keep receiving the plain application payload.
 */
export function useEveryActionSubmission(deps: Services = services) {
  const [state, setState] = useState<EveryActionSubmissionState>(INITIAL_STATE)
  const inFlightRef = useRef(false)
  const submissionService = deps.submission

  async function submit(values: EveryActionSubmissionValues) {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setState({
      status: 'loading',
      errorKind: 'error',
      referenceId: '',
      fieldErrors: {},
      started: true,
    })

    const payload = {
      intakeId: values.intakeId,
      zipCode: values.zipCode,
      language: values.language,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      streetAddress: values.streetAddress,
      apartment: values.apartment,
      city: values.city,
      state: values.state,
      documents: values.documents,
    }

    try {
      const result = await submissionService.submit(payload)

      if (!result.success) {
        setState({
          status: 'error',
          errorKind: result.errorKind ?? 'error',
          referenceId: '',
          fieldErrors: result.fieldErrors ?? {},
          started: true,
        })
        return result
      }

      setState({
        status: 'success',
        errorKind: 'error',
        referenceId: result.referenceId || 'CAP-0000',
        fieldErrors: {},
        started: true,
      })
      return result
    } catch (error) {
      const kind: EveryActionSubmissionState['errorKind'] =
        error instanceof SubmissionError ? error.kind : 'networkError'
      setState({
        status: 'error',
        errorKind: kind,
        referenceId: '',
        fieldErrors: {},
        started: true,
      })
      return { success: false as const, errorKind: kind }
    } finally {
      inFlightRef.current = false
    }
  }

  function reset() {
    inFlightRef.current = false
    setState(INITIAL_STATE)
  }

  return { ...state, submit, reset }
}
