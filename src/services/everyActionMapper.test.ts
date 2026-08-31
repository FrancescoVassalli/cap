import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EVERY_ACTION_CONFIG,
  buildEveryActionMeta,
  buildUrlEncoded,
  detectBrowserName,
  detectDeviceType,
  toEveryActionBody,
} from './everyActionMapper'
import type { SubmissionPayload } from './submissionService'

function makePayload(overrides: Partial<SubmissionPayload> = {}): SubmissionPayload {
  return {
    intakeId: 'uuid-1',
    zipCode: '80203',
    language: 'en',
    firstName: 'Avery',
    lastName: 'Smith',
    email: 'avery@example.com',
    phone: '3035551234',
    streetAddress: '123 Main St',
    city: 'Denver',
    state: 'CO',
    ...overrides,
  }
}

const meta = {
  formSessionId: 'session-1',
  clientSubmissionId: 'client-1',
  formVersion: '12/10/2024 6:54:59 PM|',
  browserName: 'firefox',
  deviceType: 'desktop',
}

describe('toEveryActionBody', () => {
  it('maps all collected fields to the EveryAction field names', () => {
    const body = toEveryActionBody(makePayload(), meta)
    expect(body.FirstName).toBe('Avery')
    expect(body.LastName).toBe('Smith')
    expect(body.EmailAddress).toBe('avery@example.com')
    expect(body.AddressLine1).toBe('123 Main St')
    expect(body.City).toBe('Denver')
    expect(body.PostalCode).toBe('80203')
  })

  it('maps English to the configured numeric language id', () => {
    const body = toEveryActionBody(makePayload({ language: 'en' }), meta)
    expect(body.PreferredLanguages).toBe(DEFAULT_EVERY_ACTION_CONFIG.languageIds.en)
  })

  it('maps Spanish to the configured numeric language id', () => {
    const body = toEveryActionBody(makePayload({ language: 'es' }), meta)
    expect(body.PreferredLanguages).toBe(DEFAULT_EVERY_ACTION_CONFIG.languageIds.es)
  })

  it('supports swapping language ids through the config seam', () => {
    const body = toEveryActionBody(makePayload({ language: 'es' }), meta, {
      ...DEFAULT_EVERY_ACTION_CONFIG,
      languageIds: { en: '3', es: '15' },
    })
    expect(body.PreferredLanguages).toBe('15')
  })

  it('splits phone into country code, dialing prefix, and local number', () => {
    const body = toEveryActionBody(makePayload({ phone: '303-555-1234' }), meta)
    expect(body.HomePhoneCountryCode).toBe('us')
    expect(body.HomePhoneInternationalDialingPrefix).toBe('1')
    expect(body.HomePhone).toBe('3035551234')
  })

  it('omits phone entirely when not provided', () => {
    const body = toEveryActionBody(makePayload({ phone: '' }), meta)
    expect(body.HomePhone).toBeUndefined()
    expect(body.HomePhoneCountryCode).toBeUndefined()
    expect(body.HomePhoneInternationalDialingPrefix).toBeUndefined()
  })

  it('omits ZIP entirely when the ZIP step was skipped', () => {
    const body = toEveryActionBody(makePayload({ zipCode: '' }), meta)
    expect(body.PostalCode).toBeUndefined()
  })

  it('omits the address when it is blank', () => {
    const body = toEveryActionBody(makePayload({ streetAddress: '' }), meta)
    expect(body.AddressLine1).toBeUndefined()
  })

  it('carries request metadata and form-version fields', () => {
    const body = toEveryActionBody(makePayload(), meta)
    expect(body.FormSessionId).toBe('session-1')
    expect(body.ClientSubmissionId).toBe('client-1')
    expect(body.BrowserName).toBe('firefox')
    expect(body.DeviceType).toBe('desktop')
    expect(body.XFromApp).toBe(DEFAULT_EVERY_ACTION_CONFIG.xFromApp)
    expect(body.ActionTagBaseUrl).toBe(DEFAULT_EVERY_ACTION_CONFIG.actionTagBaseUrl)
    expect(body.FormVersion).toBe('12/10/2024 6:54:59 PM|')
    expect(body.type).toBe(DEFAULT_EVERY_ACTION_CONFIG.type)
  })

  it('does not transmit documents as file bytes in the body', () => {
    const body = toEveryActionBody(
      makePayload({ documents: [{ id: 'd1', name: 'note.pdf', size: 10, type: 'application/pdf' }] }),
      meta,
    )
    expect(Object.values(body).some((value) => value.includes('note.pdf'))).toBe(false)
  })
})

describe('detectBrowserName', () => {
  it('recognizes a Firefox user agent', () => {
    expect(detectBrowserName('Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0')).toBe(
      'firefox',
    )
  })

  it('recognizes a Chrome user agent', () => {
    expect(detectBrowserName('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36')).toBe(
      'chrome',
    )
  })

  it('falls back to unknown for an unparseable agent', () => {
    expect(detectBrowserName('')).toBe('unknown')
  })
})

describe('detectDeviceType', () => {
  it('classifies a phone user agent as mobile', () => {
    expect(detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)')).toBe('mobile')
  })

  it('classifies a tablet user agent as tablet', () => {
    expect(detectDeviceType('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe('tablet')
  })

  it('defaults desktops to desktop', () => {
    expect(detectDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop')
  })
})

describe('buildEveryActionMeta', () => {
  it('derives session and client submission ids client-side', () => {
    const meta2 = buildEveryActionMeta({}, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120')
    expect(meta2.formSessionId).toBeTruthy()
    expect(meta2.clientSubmissionId).toBeTruthy()
    expect(meta2.browserName).toBe('chrome')
    expect(meta2.deviceType).toBe('desktop')
  })

  it('honors explicitly provided metadata', () => {
    const meta2 = buildEveryActionMeta(meta, 'ignored')
    expect(meta2.formSessionId).toBe('session-1')
    expect(meta2.browserName).toBe('firefox')
  })
})

describe('buildUrlEncoded', () => {
  it('percent-encodes special characters', () => {
    const encoded = buildUrlEncoded({ EmailAddress: 'avery@example.com', Body: 'a & b = c?' })
    expect(encoded).toContain('EmailAddress=avery%40example.com')
    expect(encoded).toContain('Body=a+%26+b+%3D+c%3F')
  })

  it('produces a form-urlencoded string from a field map', () => {
    const encoded = buildUrlEncoded({ FirstName: 'Avery', LastName: 'Smith' })
    expect(encoded).toBe('FirstName=Avery&LastName=Smith')
  })
})
