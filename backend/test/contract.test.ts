import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  ApiSubmissionService,
  type SubmissionPayload,
} from '../../src/services/submissionService'
import {
  DocumentUploadError,
  PresignedS3DocumentUploadService,
} from '../../src/services/documentUploadService'
import { getFreePort, startTestServer, type TestRuntime } from './helpers'

function makePayload(
  intakeId: string,
  overrides: Partial<SubmissionPayload> = {},
): SubmissionPayload {
  return {
    intakeId,
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

function makeFile(name: string, type: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type })
}

describe('frontend adapter contract against the real backend', () => {
  let runtime: TestRuntime

  beforeAll(async () => {
    runtime = await startTestServer()
  })

  afterAll(async () => {
    await runtime.close()
  })

  it('submits a new intake and receives a reference id', async () => {
    const service = new ApiSubmissionService(runtime.baseUrl)
    const result = await service.submit(makePayload('0f0a4302-2c3e-4f5b-9f7b-1a2b3c4d5e6f'))

    expect(result.success).toBe(true)
    expect(result.referenceId).toMatch(/^CAP-[0-9A-F]{4}-[0-9A-F]{4}$/)
    expect(result.message).toBeTruthy()
  })

  it('returns the same reference id when the same intake is retried', async () => {
    const service = new ApiSubmissionService(runtime.baseUrl)
    const first = await service.submit(makePayload('1a2b3c4d-1111-4111-8111-0f0a43022c3e'))
    const second = await service.submit(makePayload('1a2b3c4d-1111-4111-8111-0f0a43022c3e'))

    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
    expect(second.referenceId).toBe(first.referenceId)
    const intakesForId = runtime
      .store.snapshot()
      .intakes.filter((intake) => intake.intakeId === '1a2b3c4d-1111-4111-8111-0f0a43022c3e')
    expect(intakesForId).toHaveLength(1)
  })

  it('surfaces field-level validation errors from the backend', async () => {
    const service = new ApiSubmissionService(runtime.baseUrl)
    const result = await service.submit(
      makePayload('2b2c3d4e-2222-4222-8222-0f0a43022c3e', { email: '' }),
    )

    expect(result.success).toBe(false)
    expect(result.errorKind).toBe('error')
    expect(result.fieldErrors?.email).toBeTruthy()
  })

  it('maps a backend 401 to a sessionExpired error', async () => {
    const service = new ApiSubmissionService(runtime.baseUrl)
    await expect(service.submit(makePayload('expired-session-1'))).rejects.toMatchObject({
      kind: 'sessionExpired',
    })
  })

  it('maps a backend 429 to a generic error', async () => {
    const limited = await startTestServer({ rateLimit: { windowMs: 60_000, maxRequests: 1 } })
    try {
      const service = new ApiSubmissionService(limited.baseUrl)
      const first = await service.submit(makePayload('0f0a4302-2222-4222-8222-1a2b3c4d5e6f'))
      expect(first.success).toBe(true)
      await expect(
        service.submit(makePayload('0f0a4302-3333-4333-8333-1a2b3c4d5e6f')),
      ).rejects.toMatchObject({ kind: 'error' })
    } finally {
      await limited.close()
    }
  })

  it('maps a network failure to a networkError', async () => {
    const closedPort = await getFreePort()
    const service = new ApiSubmissionService(`http://127.0.0.1:${closedPort}`)
    await expect(service.submit(makePayload('3c3d4e5f-3333-4333-8333-1a2b3c4d5e6f'))).rejects.toMatchObject({
      kind: 'networkError',
    })
  })

  it('uploads a document through the presigned-URL flow', async () => {
    const service = new PresignedS3DocumentUploadService(runtime.baseUrl)
    const file = makeFile('bill.pdf', 'application/pdf')
    const result = await service.upload(file, '0f0a4302-2c3e-4f5b-9f7b-1a2b3c4d5e6f')

    expect(result.id).toMatch(/^0f0a4302-2c3e-4f5b-9f7b-1a2b3c4d5e6f-/)
    expect(result.url).toMatch(/^managed:\/\/intakes\//)

    const documents = runtime.store.snapshot().documents
    expect(documents).toHaveLength(1)
    expect(documents[0].status).toBe('uploaded')
    expect(documents[0].fileName).toBe('bill.pdf')
  })

  it('rejects an unsupported document before any upload happens', async () => {
    const service = new PresignedS3DocumentUploadService(runtime.baseUrl)
    const file = makeFile('malware.txt', 'text/plain')
    await expect(service.upload(file, '0f0a4302-2c3e-4f5b-9f7b-1a2b3c4d5e6f')).rejects.toBeInstanceOf(
      DocumentUploadError,
    )
  })

  it('never logs raw consumer data', () => {
    const joined = runtime.logLines.join('\n')
    expect(joined).not.toContain('avery@example.com')
    expect(joined).not.toContain('Avery')
    expect(joined).not.toContain('3035551234')
  })
})