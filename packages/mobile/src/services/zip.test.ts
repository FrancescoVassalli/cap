import { describe, expect, it } from 'vitest'
import { StaticZipService, zipService } from './zip'

describe('StaticZipService', () => {
  it('returns the city and county for a known Colorado ZIP', () => {
    expect(zipService.lookup('80203')).toMatchObject({
      zipCode: '80203',
      city: 'Denver',
      state: 'CO',
      county: 'Denver',
    })
  })

  it('returns null for an unknown but well-formed ZIP', () => {
    expect(zipService.lookup('99999')).toBeNull()
  })

  it('returns null for blank or malformed input', () => {
    expect(zipService.lookup('')).toBeNull()
    expect(zipService.lookup('802')).toBeNull()
    expect(zipService.lookup('80 203')).toBeNull()
    expect(zipService.lookup('802031')).toBeNull()
  })

  it('trims surrounding whitespace before matching', () => {
    expect(zipService.lookup('  80203  ')).toMatchObject({ zipCode: '80203' })
  })

  it('supports injecting a custom dataset without blocking unknown codes', () => {
    const custom = new StaticZipService({ '00000': { zipCode: '00000', city: 'Testville', state: 'CO', county: 'Test' } })
    expect(custom.lookup('00000')).toMatchObject({ city: 'Testville' })
    expect(custom.lookup('11111')).toBeNull()
  })
})