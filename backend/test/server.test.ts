import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startTestServer, type TestRuntime } from './helpers'

export const VALID_INTAKE_ID = '0f0a4302-2c3e-4f5b-9f7b-1a2b3c4d5e6f'

function intakeBody(overrides: Record<string, string | undefined> = {}): string {
  const fields: Record<string, string> = {
    type: 'SignupForm',
    FirstName: 'Avery',
    LastName: 'Smith',
    PreferredLanguages: '62',
    EmailAddress: 'avery@example.com',
    City: 'Denver',
    PostalCode: '80203',
    AddressLine1: '123 Main St',
    HomePhone: '3035551234',
    FormSessionId: 'session-1',
    ClientSubmissionId: 'client-1',
    BrowserName: 'chrome',
    DeviceType: 'desktop',
    XFromApp: 'ActionTag',
    ActionTagBaseUrl: 'https://static.everyaction.com/ea-actiontag/',
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete fields[key]
    else fields[key] = value
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) params.set(key, value)
  return params.toString()
}

async function postIntake(
  runtime: TestRuntime,
  body: string,
  intakeId: string = VALID_INTAKE_ID,
): Promise<Response> {
  return fetch(`${runtime.baseUrl}/intakes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Idempotency-Key': intakeId,
    },
    body,
  })
}

async function parse<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

describe('POST /intakes', () => {
  let runtime: TestRuntime

  beforeAll(async () => {
    runtime = await startTestServer()
  })

  afterAll(async () => {
    await runtime.close()
  })

  it('accepts a valid intake and returns a CAP reference id', async () => {
    const response = await postIntake(runtime, intakeBody())
    expect(response.status).toBe(201)
    const data = await parse<{ referenceId?: string }>(response)
    expect(data.referenceId).toMatch(/^CAP-[0-9A-F]{4}-[0-9A-F]{4}$/)

    const snapshot = runtime.store.snapshot()
    expect(snapshot.intakes).toHaveLength(1)
    expect(snapshot.intakes[0].sourceChannel).toBe('web')
    expect(snapshot.intakes[0].fields.FirstName).toBe('Avery')
  })

  it('replays the original reference id for a duplicate submission', async () => {
    const first = await postIntake(runtime, intakeBody())
    const firstBody = await parse<{ referenceId?: string }>(first)

    const second = await postIntake(runtime, intakeBody())
    expect(second.status).toBe(200)
    const secondBody = await parse<{ referenceId?: string }>(second)

    expect(secondBody.referenceId).toBe(firstBody.referenceId)
    expect(runtime.store.snapshot().intakes).toHaveLength(1)
  })

  it('returns field-level errors without persisting an invalid submission', async () => {
    const intakeId = '11111111-1111-4111-8111-111111111111'
    const response = await postIntake(
      runtime,
      intakeBody({ EmailAddress: '', PostalCode: '802' }),
      intakeId,
    )
    expect(response.status).toBe(422)
    const data = await parse<{ errors?: Record<string, string> }>(response)
    expect(data.errors?.email).toBeTruthy()
    expect(data.errors?.zipCode).toBeTruthy()
    expect(data.errors?.firstName).toBeUndefined()
    expect(
      runtime.store.snapshot().intakes.some((intake) => intake.intakeId === intakeId),
    ).toBe(false)
  })

  it('rejects an invalid email address', async () => {
    const intakeId = '22222222-2222-4222-8222-222222222222'
    const response = await postIntake(runtime, intakeBody({ EmailAddress: 'not-an-email' }), intakeId)
    expect(response.status).toBe(422)
    const data = await parse<{ errors?: Record<string, string> }>(response)
    expect(data.errors?.email).toBe('Enter a valid email address.')
  })

  it('rejects an unknown language id', async () => {
    const intakeId = '33333333-3333-4333-8333-333333333333'
    const response = await postIntake(runtime, intakeBody({ PreferredLanguages: '99' }), intakeId)
    expect(response.status).toBe(422)
    const data = await parse<{ errors?: Record<string, string> }>(response)
    expect(data.errors?.language).toBeTruthy()
  })

  it('rejects a missing or malformed idempotency key as session expiry', async () => {
    const response = await fetch(`${runtime.baseUrl}/intakes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: intakeBody(),
    })
    expect(response.status).toBe(401)
    const data = await parse<{ error?: { code?: string } }>(response)
    expect(data.error?.code).toBe('session_expired')
  })

  it('returns 404 for unknown routes', async () => {
    const response = await fetch(`${runtime.baseUrl}/unknown`, { method: 'GET' })
    expect(response.status).toBe(404)
    const data = await parse<{ error?: { code?: string } }>(response)
    expect(data.error?.code).toBe('not_found')
  })

  it('does not log raw payload values', () => {
    const joined = runtime.logLines.join('\n')
    expect(joined).not.toContain('avery@example.com')
    expect(joined).not.toContain('Avery')
    expect(joined).not.toContain('123 Main St')
  })
})

describe('POST /intakes/:id/upload-url', () => {
  let runtime: TestRuntime

  beforeAll(async () => {
    runtime = await startTestServer()
  })

  afterAll(async () => {
    await runtime.close()
  })

  async function requestUpload(
    intakeId: string,
    metadata: Record<string, unknown>,
  ): Promise<Response> {
    return fetch(`${runtime.baseUrl}/intakes/${intakeId}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    })
  }

  it('issues a presigned URL and marks the document uploaded after the PUT', async () => {
    const response = await requestUpload(VALID_INTAKE_ID, {
      fileName: '../bill.pdf',
      contentType: 'application/pdf',
      size: 2048,
    })
    expect(response.status).toBe(200)
    const data = await parse<{ uploadUrl?: string }>(response)
    expect(data.uploadUrl).toMatch(new RegExp(`^${runtime.baseUrl}/uploads/`))

    const put = await fetch(data.uploadUrl as string, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: 'file-bytes',
    })
    expect(put.status).toBe(200)

    const documents = runtime.store.snapshot().documents
    expect(documents).toHaveLength(1)
    expect(documents[0].status).toBe('uploaded')
    expect(documents[0].fileName).toBe('bill.pdf')
    expect(documents[0].contentType).toBe('application/pdf')
    expect(documents[0].size).toBe(2048)
    expect(documents[0].objectKey).not.toContain('bill.pdf')
  })

  it('rejects unsupported file types', async () => {
    const response = await requestUpload(VALID_INTAKE_ID, {
      fileName: 'malware.txt',
      contentType: 'text/plain',
      size: 100,
    })
    expect(response.status).toBe(422)
    const data = await parse<{ errors?: Record<string, string> }>(response)
    expect(data.errors?.fileType).toBeTruthy()
  })

  it('rejects files larger than the per-file limit', async () => {
    const response = await requestUpload(VALID_INTAKE_ID, {
      fileName: 'big.pdf',
      contentType: 'application/pdf',
      size: 11 * 1024 * 1024,
    })
    expect(response.status).toBe(422)
    const data = await parse<{ errors?: Record<string, string> }>(response)
    expect(data.errors?.size).toBeTruthy()
  })

  it('enforces the cumulative total size limit for an intake', async () => {
    const intakeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    let accepted = 0
    let rejectionStatus = 0
    let rejectionBody: { errors?: Record<string, string> } | undefined

    for (let index = 0; index < 8; index += 1) {
      const response = await requestUpload(intakeId, {
        fileName: `file-${index}.pdf`,
        contentType: 'application/pdf',
        size: 8 * 1024 * 1024,
      })
      if (response.status === 200) {
        accepted += 1
      } else {
        rejectionStatus = response.status
        rejectionBody = (await response.json()) as { errors?: Record<string, string> }
        break
      }
    }

    // Six 8 MB files (48 MB) are within the 50 MB cumulative budget; the
    // seventh pushes the intake over the total limit.
    expect(accepted).toBe(6)
    expect(rejectionStatus).toBe(422)
    expect(rejectionBody?.errors?.size).toBeTruthy()
  })

  it('returns a validation error for malformed JSON', async () => {
    const response = await fetch(`${runtime.baseUrl}/intakes/${VALID_INTAKE_ID}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    })
    expect(response.status).toBe(422)
    const data = await parse<{ errors?: Record<string, string> }>(response)
    expect(data.errors?.form).toBeTruthy()
  })

  it('rejects an intake id that is not a valid session id', async () => {
    const response = await requestUpload('not-a-uuid', {
      fileName: 'bill.pdf',
      contentType: 'application/pdf',
      size: 100,
    })
    expect(response.status).toBe(401)
    const data = await parse<{ error?: { code?: string } }>(response)
    expect(data.error?.code).toBe('session_expired')
  })

  it('rejects an upload to an expired or tampered presigned URL', async () => {
    const put = await fetch(`${runtime.baseUrl}/uploads/550e8400-e29b-41d4-a716-446655440000?token=tampered`, {
      method: 'PUT',
      body: 'file-bytes',
    })
    expect(put.status).toBe(403)
  })
})

describe('GET /health', () => {
  let runtime: TestRuntime

  beforeAll(async () => {
    runtime = await startTestServer()
  })

  afterAll(async () => {
    await runtime.close()
  })

  it('reports the API as healthy', async () => {
    const response = await fetch(`${runtime.baseUrl}/health`)
    expect(response.status).toBe(200)
    const data = await parse<{ status?: string; service?: string }>(response)
    expect(data.status).toBe('ok')
    expect(data.service).toBe('cap-api')
  })
})

describe('rate limiting', () => {
  let runtime: TestRuntime

  beforeAll(async () => {
    runtime = await startTestServer({
      rateLimit: { windowMs: 60_000, maxRequests: 2 },
    })
  })

  afterAll(async () => {
    await runtime.close()
  })

  it('rejects requests beyond the configured limit', async () => {
    const first = await postIntake(
      runtime,
      intakeBody(),
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    )
    expect(first.status).toBe(201)

    const second = await postIntake(
      runtime,
      intakeBody(),
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    )
    expect(second.status).toBe(201)

    const third = await postIntake(
      runtime,
      intakeBody(),
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    )
    expect(third.status).toBe(429)
    const data = await parse<{ error?: { code?: string } }>(third)
    expect(data.error?.code).toBe('rate_limited')
  })
})

describe('HTTPS enforcement', () => {
  let runtime: TestRuntime

  beforeAll(async () => {
    runtime = await startTestServer({ requireHttps: true })
  })

  afterAll(async () => {
    await runtime.close()
  })

  it('rejects non-HTTPS intake submissions', async () => {
    const response = await postIntake(runtime, intakeBody())
    expect(response.status).toBe(400)
    const data = await parse<{ error?: { code?: string } }>(response)
    expect(data.error?.code).toBe('https_required')
  })

  it('still allows the health check', async () => {
    const response = await fetch(`${runtime.baseUrl}/health`)
    expect(response.status).toBe(200)
  })
})