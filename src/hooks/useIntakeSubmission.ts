import { useRef, useState } from 'react'
import { services, SubmissionError, type Services } from '@/services'
import type { SubmissionErrorKind, SubmissionStatus } from '@/types/index'

export type SubmissionState = {
  status: SubmissionStatus
  errorKind: SubmissionErrorKind
  referenceId: string
  started: boolean
}

const INITIAL_STATE: SubmissionState = {
  status: 'idle',
  errorKind: 'error',
  referenceId: '',
  started: false,
}

/**
 * Hook that encapsulates the submission lifecycle (idle -> loading -> success |
 * error) behind the submission service boundary. The form layer no longer
 * manages submission mechanics or instantiates the service directly.
 */
export function useIntakeSubmission(deps: Services = services) {
  const [state, setState] = useState<SubmissionState>(INITIAL_STATE)
  // Guards against duplicate submissions (double-click / race) without relying
  // on a render-round; mirrors the idempotency the backend will enforce.
  const inFlightRef = useRef(false)
  const submissionService = deps.submission

  async function submit(
    payload: Parameters<typeof submissionService.submit>[0],
  ) {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setState({ status: 'loading', errorKind: 'error', referenceId: '', started: true })
    try {
      const result = await submissionService.submit(payload)

      if (!result.success) {
        setState({
          status: 'error',
          errorKind: result.errorKind ?? 'error',
          referenceId: '',
          started: true,
        })
        return result
      }

      setState({
        status: 'success',
        errorKind: 'error',
        referenceId: result.referenceId || 'CAP-0000',
        started: true,
      })
      return result
    } catch (error) {
      const kind: SubmissionErrorKind =
        error instanceof SubmissionError ? error.kind : 'networkError'
      setState({ status: 'error', errorKind: kind, referenceId: '', started: true })
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
