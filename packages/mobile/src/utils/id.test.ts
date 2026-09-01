import { describe, expect, it } from 'vitest'
import { randomUUID } from './id'

describe('randomUUID', () => {
  it('produces a well-formed UUIDv4 matching the backend Idempotency-Key gate', () => {
    const value = randomUUID()
    expect(value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it('produces distinct ids across calls', () => {
    expect(randomUUID()).not.toBe(randomUUID())
  })
})