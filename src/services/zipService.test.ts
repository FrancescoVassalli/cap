import { describe, expect, it } from 'vitest'
import { StaticZipService } from './zipService'

describe('StaticZipService', () => {
  const records: Record<string, { zipCode: string; city: string; state: string }> = {
    '80203': { zipCode: '80203', city: 'Denver', state: 'CO' },
    '80521': { zipCode: '80521', city: 'Fort Collins', state: 'CO' },
  }

  it('returns the location for a known ZIP', () => {
    const service = new StaticZipService(records)
    expect(service.lookup('80203')).toEqual({
      zipCode: '80203',
      city: 'Denver',
      state: 'CO',
    })
  })

  it('normalizes surrounding whitespace before lookup', () => {
    const service = new StaticZipService(records)
    expect(service.lookup(' 80203 ')).toMatchObject({ city: 'Denver' })
  })

  it('returns null for an unknown ZIP', () => {
    const service = new StaticZipService(records)
    expect(service.lookup('99999')).toBeNull()
  })

  it('returns null for an empty string', () => {
    const service = new StaticZipService(records)
    expect(service.lookup('')).toBeNull()
  })

  it('returns null for a malformed (non-five-digit) ZIP', () => {
    const service = new StaticZipService(records)
    expect(service.lookup('123')).toBeNull()
    expect(service.lookup('80203-1234')).toBeNull()
  })

  it('loads the bundled Colorado dataset by default', () => {
    const service = new StaticZipService()
    expect(service.lookup('80203')).toMatchObject({ city: 'Denver', state: 'CO' })
    expect(service.lookup('80521')).toMatchObject({ city: 'Fort Collins', state: 'CO' })
    expect(service.lookup('81611')).toMatchObject({ city: 'Aspen', state: 'CO' })
  })
})
