import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEveryActionSubmission, type EveryActionSubmissionValues } from './useEveryActionSubmission'
import { SubmissionError, type SubmissionService } from '@/services/submissionService'
import type { IntakeSubmissionResult } from '@/types/index'

function makeDeps(submission: SubmissionService) {
  return { submission } as never
}

const values: EveryActionSubmissionValues = {
  intakeId: 'intake-1',
  zipCode: '80203',
  language: 'en',
  firstName: 'Avery',
  lastName: 'Smith',
  email: 'avery@example.com',
  phone: '3035551234',
  streetAddress: '123 Main St',
  apartment: '',
  city: 'Denver',
  state: 'CO',
  documents: [],
}

describe('useEveryActionSubmission', () => {
  it('submits and reaches a success state with a reference id', async () => {
    const submission: SubmissionService = {
      async submit() {
        return { success: true, referenceId: 'CAP-1234', message: 'ok' }
      },
    }
    const { result } = renderHook(() => useEveryActionSubmission(makeDeps(submission)))

    await act(async () => {
      await result.current.submit(values)
    })

    expect(result.current.status).toBe('success')
    expect(result.current.referenceId).toBe('CAP-1234')
    expect(result.current.started).toBe(true)
  })

  it('passes the application payload to the submission service', async () => {
    const captured: unknown[] = []
    const submission: SubmissionService = {
      async submit(payload) {
        captured.push(payload)
        return { success: true, referenceId: 'CAP-REF', message: 'ok' }
      },
    }
    const { result } = renderHook(() => useEveryActionSubmission(makeDeps(submission)))

    await act(async () => {
      await result.current.submit(values)
    })

    expect(captured).toHaveLength(1)
    expect(captured[0]).toMatchObject({
      intakeId: 'intake-1',
      language: 'en',
      firstName: 'Avery',
      lastName: 'Smith',
      email: 'avery@example.com',
      phone: '3035551234',
    })
  })

  it('reaches an error state on a failed submission', async () => {
    const submission: SubmissionService = {
      async submit() {
        return { success: false, errorKind: 'error', message: 'failed' }
      },
    }
    const { result } = renderHook(() => useEveryActionSubmission(makeDeps(submission)))

    await act(async () => {
      await result.current.submit(values)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorKind).toBe('error')
  })

  it('preserves server field errors for the form to display', async () => {
    const submission: SubmissionService = {
      async submit() {
        return {
          success: false,
          errorKind: 'error',
          message: 'Check the highlighted fields.',
          fieldErrors: { email: 'That email is already in use.', phone: 'Invalid phone.' },
        }
      },
    }
    const { result } = renderHook(() => useEveryActionSubmission(makeDeps(submission)))

    await act(async () => {
      await result.current.submit(values)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.fieldErrors).toEqual({
      email: 'That email is already in use.',
      phone: 'Invalid phone.',
    })
  })

  it('maps thrown SubmissionError kinds to an error state', async () => {
    const submission: SubmissionService = {
      async submit() {
        throw new SubmissionError('sessionExpired')
      },
    }
    const { result } = renderHook(() => useEveryActionSubmission(makeDeps(submission)))

    await act(async () => {
      await result.current.submit(values)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorKind).toBe('sessionExpired')
  })

  it('maps unknown exceptions to a network error', async () => {
    const submission: SubmissionService = {
      async submit() {
        throw new Error('boom')
      },
    }
    const { result } = renderHook(() => useEveryActionSubmission(makeDeps(submission)))

    await act(async () => {
      await result.current.submit(values)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorKind).toBe('networkError')
  })

  it('resets back to the idle state', async () => {
    const submission: SubmissionService = {
      async submit() {
        return { success: true, referenceId: 'CAP-1234', message: 'ok' }
      },
    }
    const { result } = renderHook(() => useEveryActionSubmission(makeDeps(submission)))

    await act(async () => {
      await result.current.submit(values)
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.started).toBe(false)
    expect(result.current.referenceId).toBe('')
  })

  it('guards against duplicate concurrent submissions', async () => {
    let resolveSubmit: (r: IntakeSubmissionResult) => void = () => undefined
    let callCount = 0
    const submission: SubmissionService = {
      async submit() {
        callCount += 1
        return new Promise<IntakeSubmissionResult>((resolve) => {
          resolveSubmit = resolve
        })
      },
    }
    const { result } = renderHook(() => useEveryActionSubmission(makeDeps(submission)))

    let first: Promise<unknown> = Promise.resolve()
    let second: Promise<unknown> = Promise.resolve()
    await act(async () => {
      first = result.current.submit(values)
      second = result.current.submit(values)
    })

    await act(async () => {
      resolveSubmit({ success: true, referenceId: 'CAP-1', message: 'ok' })
      await first
      await second
    })

    expect(callCount).toBe(1)
  })
})
