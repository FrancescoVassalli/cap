import { describe, expect, it } from 'vitest'
import {
  ApiSubmissionService,
  EmailSubmissionService,
  MockSubmissionService,
  SubmissionError,
  createSubmissionService,
  type SubmissionPayload,
} from './submissionService'

function makePayload(overrides: Partial<SubmissionPayload> = {}): SubmissionPayload {
  return {
    intakeId: 'uuid-1',
    zipCode: '80203',
    language: 'en',
    firstName: 'Avery',
    lastName: 'Smith',
    email: 'avery@example.com',
    streetAddress: '123 Main St',
    city: 'Denver',
    state: 'CO',
    ...overrides,
  }
}

describe('MockSubmissionService', () => {
  const service = new MockSubmissionService()

  it('returns a success result with a CAP reference id', async () => {
    const result = await service.submit(makePayload())
    expect(result.success).toBe(true)
    expect(result.referenceId).toMatch(/^CAP-/)
  })

  it('returns a failure result when required information is missing', async () => {
    const result = await service.submit(makePayload({ email: '' }))
    expect(result.success).toBe(false)
    expect(result.errorKind).toBe('error')
  })

  it('does not duplicate reference ids across calls', async () => {
    const first = await service.submit(makePayload())
    const second = await service.submit(makePayload())
    expect(first.referenceId).not.toBe(second.referenceId)
  })
})

describe('EmailSubmissionService', () => {
  const service = new EmailSubmissionService('cap@example.com')

  it('returns a success result for a demo notification', async () => {
    const result = await service.submit(makePayload())
    expect(result.success).toBe(true)
    expect(result.referenceId).toMatch(/^CAP-/)
  })
})

describe('ApiSubmissionService', () => {
  it('throws a SubmissionError when no backend is configured', async () => {
    const service = new ApiSubmissionService('')
    await expect(service.submit(makePayload())).rejects.toBeInstanceOf(SubmissionError)
  })

  it('maps an HTTP 401/403 to a sessionExpired error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 401, ok: false, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    try {
      const service = new ApiSubmissionService('https://cap.example')
      await expect(service.submit(makePayload())).rejects.toMatchObject({ kind: 'sessionExpired' })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('surfaces server field errors on a 4xx response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ status: 422, ok: false, json: async () => ({ errors: { email: 'bad email' } }) })
    vi.stubGlobal('fetch', fetchMock)
    try {
      const service = new ApiSubmissionService('https://cap.example')
      const result = await service.submit(makePayload())
      expect(result.success).toBe(false)
      expect(result.fieldErrors?.email).toBe('bad email')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('sends the intake id as an idempotency key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ referenceId: 'CAP-REF' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    try {
      const service = new ApiSubmissionService('https://cap.example')
      await service.submit(makePayload({ intakeId: 'idem-1' }))
      const [, init] = fetchMock.mock.calls[0]
      expect((init as RequestInit).headers).toMatchObject({ 'Idempotency-Key': 'idem-1' })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('posts a URL-encoded EveryAction body rather than raw JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ referenceId: 'CAP-REF' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    try {
      const service = new ApiSubmissionService('https://cap.example')
      await service.submit(makePayload({ firstName: 'A&very', zipCode: '80203' }))
      const [, init] = fetchMock.mock.calls[0]
      expect((init as RequestInit).headers).toMatchObject({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      })
      const body = (init as RequestInit).body as string
      expect(body).toContain('FirstName=A%26very')
      expect(body).toContain('PostalCode=80203')
      expect(body).toContain('PreferredLanguages=62')
      expect(body).toContain('EmailAddress=avery%40example.com')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('omits optional ZIP and phone from the EveryAction body when skipped', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ referenceId: 'CAP-REF' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    try {
      const service = new ApiSubmissionService('https://cap.example')
      await service.submit(makePayload({ zipCode: '', phone: '' }))
      const body = (fetchMock.mock.calls[0][1] as RequestInit).body as string
      expect(body).not.toContain('PostalCode=')
      expect(body).not.toContain('HomePhone=')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('maps a network failure to a networkError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    try {
      const service = new ApiSubmissionService('https://cap.example')
      await expect(service.submit(makePayload())).rejects.toMatchObject({ kind: 'networkError' })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('createSubmissionService', () => {
  it('defaults to the mock adapter', () => {
    expect(createSubmissionService()).toBeInstanceOf(MockSubmissionService)
  })

  it('creates the email adapter when requested', () => {
    expect(createSubmissionService('email', { recipient: 'cap@example.com' })).toBeInstanceOf(
      EmailSubmissionService,
    )
  })

  it('creates the api adapter when requested', () => {
    expect(createSubmissionService('api', { baseUrl: 'https://cap.example' })).toBeInstanceOf(
      ApiSubmissionService,
    )
  })
})
