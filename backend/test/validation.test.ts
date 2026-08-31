import { describe, expect, it } from 'vitest'
import {
  sanitizeFileName,
  UPLOAD_LIMITS,
  validateUploadMetadata,
} from '../src/validation/upload.js'
import { validateIntakeForm } from '../src/validation/intake.js'

describe('validateIntakeForm', () => {
  function form(overrides: Record<string, string> = {}): URLSearchParams {
    const fields: Record<string, string> = {
      FirstName: 'Avery',
      LastName: 'Smith',
      PreferredLanguages: '62',
      EmailAddress: 'avery@example.com',
      City: 'Denver',
      PostalCode: '80203',
      HomePhone: '3035551234',
      ...overrides,
    }
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(fields)) params.set(key, value)
    return params
  }

  it('accepts a complete intake form', () => {
    expect(validateIntakeForm(form())).toEqual({})
  })

  it('flags missing required fields by application field name', () => {
    const errors = validateIntakeForm(form({ FirstName: '', LastName: '', EmailAddress: '' }))
    expect(errors.firstName).toBe('First name is required.')
    expect(errors.lastName).toBe('Last name is required.')
    expect(errors.email).toBe('Email address is required.')
  })

  it('rejects an invalid email address', () => {
    expect(validateIntakeForm(form({ EmailAddress: 'nope' })).email).toBe(
      'Enter a valid email address.',
    )
  })

  it('rejects a malformed ZIP when one is present', () => {
    expect(validateIntakeForm(form({ PostalCode: '8020' })).zipCode).toBeTruthy()
  })

  it('accepts an unknown language id only from the known set', () => {
    expect(validateIntakeForm(form({ PreferredLanguages: '99' })).language).toBeTruthy()
    expect(validateIntakeForm(form({ PreferredLanguages: '15' })).language).toBeUndefined()
  })

  it('allows the optional phone to be empty', () => {
    expect(validateIntakeForm(form({ HomePhone: '' })).phone).toBeUndefined()
  })
})

describe('validateUploadMetadata', () => {
  it('accepts a PDF by MIME type', () => {
    const result = validateUploadMetadata(
      { fileName: 'bill.pdf', contentType: 'application/pdf', size: 1024 },
      0,
    )
    expect(result.errors).toEqual({})
    expect(result.metadata?.contentType).toBe('application/pdf')
  })

  it('accepts an image by extension when the MIME type is generic', () => {
    const result = validateUploadMetadata(
      { fileName: 'photo.jpg', contentType: 'application/octet-stream', size: 1024 },
      0,
    )
    expect(result.errors).toEqual({})
  })

  it('rejects unsupported file types', () => {
    const result = validateUploadMetadata(
      { fileName: 'malware.exe', contentType: 'application/octet-stream', size: 100 },
      0,
    )
    expect(result.errors.fileType).toBeTruthy()
  })

  it('rejects files over the per-file limit', () => {
    const result = validateUploadMetadata(
      { fileName: 'big.pdf', contentType: 'application/pdf', size: 11 * 1024 * 1024 },
      0,
    )
    expect(result.errors.size).toBe('File must be 10 MB or smaller.')
  })

  it('rejects batches over the cumulative total limit', () => {
    const result = validateUploadMetadata(
      { fileName: 'extra.pdf', contentType: 'application/pdf', size: 5 * 1024 * 1024 },
      UPLOAD_LIMITS.maxTotalSizeBytes,
    )
    expect(result.errors.size).toBeTruthy()
  })

  it('requires a file name and a positive size', () => {
    const result = validateUploadMetadata(
      { fileName: '', contentType: 'application/pdf', size: 0 },
      0,
    )
    expect(result.errors.fileName).toBeTruthy()
    expect(result.errors.size).toBeTruthy()
  })
})

describe('sanitizeFileName', () => {
  it('strips path separators and control characters', () => {
    expect(sanitizeFileName('../notes/bill\u0000.pdf')).toBe('notesbill.pdf')
  })

  it('trims whitespace and caps the length', () => {
    const long = `${'a'.repeat(300)}.pdf`
    expect(sanitizeFileName(long).length).toBe(UPLOAD_LIMITS.maxFileNameLength)
  })
})