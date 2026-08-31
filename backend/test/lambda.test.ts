import { describe, expect, it } from 'vitest'
import { createLambdaHandler, type LambdaEvent, type LambdaResult } from '../src/lambda.js'
import { createConfig } from '../src/config.js'
import { createMemoryStore } from '../src/repository/memoryStore.js'
import { createLocalPresigner } from '../src/presigner/localPresigner.js'
import { createApiLogger } from '../src/logging.js'
import { createRateLimiter } from '../src/rateLimit.js'
import type { ApiDependencies } from '../src/context.js'

function testDependencies(): ApiDependencies {
  const config = createConfig({ 'CAP_UPLOAD_SIGNING_SECRET': 'lambda-test-secret' })
  return {
    config,
    store: createMemoryStore(),
    presigner: createLocalPresigner(config),
    logger: createApiLogger({ enabled: false }),
    rateLimiter: createRateLimiter({ windowMs: 60_000, maxRequests: 1000 }),
  }
}

const INTAKE_EVENT: LambdaEvent = {
  httpMethod: 'POST',
  path: '/intakes',
  headers: {
    'idempotency-key': '0f0a4302-2c3e-4f5b-9f7b-1a2b3c4d5e6f',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  },
  body: new URLSearchParams({
    FirstName: 'Avery',
    LastName: 'Smith',
    PreferredLanguages: '62',
    EmailAddress: 'avery@example.com',
    City: 'Denver',
  }).toString(),
}

async function invoke(deps: ApiDependencies, event: LambdaEvent): Promise<LambdaResult> {
  const handler = createLambdaHandler(deps)
  return handler(event)
}

describe('createLambdaHandler', () => {
  it('returns a structured health response', async () => {
    const deps = testDependencies()
    const result = await invoke(deps, { httpMethod: 'GET', path: '/health' })
    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body).status).toBe('ok')
  })

  it('handles an intake submission event with path parameters passthrough', async () => {
    const deps = testDependencies()
    const result = await invoke(deps, INTAKE_EVENT)
    expect(result.statusCode).toBe(201)
    const body = JSON.parse(result.body) as { referenceId?: string }
    expect(body.referenceId).toMatch(/^CAP-/)
  })

  it('surfaces field validation errors as structured JSON', async () => {
    const deps = testDependencies()
    const result = await invoke(deps, {
      ...INTAKE_EVENT,
      pathParameters: {},
      body: new URLSearchParams({ FirstName: '', LastName: 'Smith', PreferredLanguages: '62', EmailAddress: 'x', City: '' }).toString(),
    })
    expect(result.statusCode).toBe(422)
    const body = JSON.parse(result.body) as { errors?: Record<string, string> }
    expect(body.errors?.firstName).toBeTruthy()
    expect(body.errors?.email).toBeTruthy()
  })

  it('handles the upload-url route with decoded path parameters', async () => {
    const deps = testDependencies()
    const result = await invoke(deps, {
      httpMethod: 'POST',
      path: '/intakes/0f0a4302-2c3e-4f5b-9f7b-1a2b3c4d5e6f/upload-url',
      pathParameters: { id: '0f0a4302-2c3e-4f5b-9f7b-1a2b3c4d5e6f' },
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'bill.pdf', contentType: 'application/pdf', size: 1024 }),
    })
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body) as { uploadUrl?: string }
    expect(body.uploadUrl).toContain('/uploads/')
  })

  it('maps an unknown route to a 404', async () => {
    const deps = testDependencies()
    const result = await invoke(deps, { httpMethod: 'GET', path: '/nope' })
    expect(result.statusCode).toBe(404)
  })

  it('decodes base64-encoded request bodies', async () => {
    const deps = testDependencies()
    const result = await invoke(deps, {
      ...INTAKE_EVENT,
      body: Buffer.from(INTAKE_EVENT.body as string, 'utf8').toString('base64'),
      isBase64Encoded: true,
    })
    expect(result.statusCode).toBe(201)
  })
})