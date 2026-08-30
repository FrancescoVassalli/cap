import { describe, expect, it } from 'vitest'
import {
  DocumentUploadError,
  LocalDocumentUploadService,
  PresignedS3DocumentUploadService,
  createDocumentUploadService,
} from './documentUploadService'

function makeFile(name = 'bill.pdf', type = 'application/pdf', size = 1024): File {
  return new File(['x'.repeat(size)], name, { type })
}

describe('LocalDocumentUploadService', () => {
  const service = new LocalDocumentUploadService()

  it('returns an uploaded document reference', async () => {
    const result = await service.upload(makeFile(), 'intake-1')
    expect(result.name).toBe('bill.pdf')
    expect(result.id).toMatch(/^intake-1-/)
  })

  it('does not use the original filename in the storage key', async () => {
    const result = await service.upload(makeFile('medical-bill.pdf'), 'intake-1')
    expect(result.url).not.toContain('medical-bill.pdf')
    expect(result.url).toMatch(/^local:\/\/intakes\//)
  })

  it('generates a distinct id for each upload', async () => {
    const first = await service.upload(makeFile(), 'intake-1')
    const second = await service.upload(makeFile(), 'intake-1')
    expect(first.id).not.toBe(second.id)
  })
})

describe('PresignedS3DocumentUploadService', () => {
  it('throws when no backend is configured (safe default)', async () => {
    const service = new PresignedS3DocumentUploadService('')
    await expect(service.upload(makeFile(), 'intake-1')).rejects.toBeInstanceOf(DocumentUploadError)
  })

  it('requests a presigned URL then uploads the file directly', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uploadUrl: 'https://s3.example/put-url' }) })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    try {
      const service = new PresignedS3DocumentUploadService('https://cap.example')
      const result = await service.upload(makeFile(), 'intake-1')

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(result.url).toMatch(/^managed:\/\/intakes\/intake-1\/documents\//)
      // The second call PUTs to the presigned URL.
      const [, putInit] = fetchMock.mock.calls[1]
      expect((putInit as RequestInit).method).toBe('PUT')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('fails cleanly when the presigned-url request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, json: async () => ({}) }))
    try {
      const service = new PresignedS3DocumentUploadService('https://cap.example')
      await expect(service.upload(makeFile(), 'intake-1')).rejects.toBeInstanceOf(DocumentUploadError)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('createDocumentUploadService', () => {
  it('defaults to the local adapter', () => {
    expect(createDocumentUploadService()).toBeInstanceOf(LocalDocumentUploadService)
  })

  it('creates the s3 adapter when requested', () => {
    expect(createDocumentUploadService('s3', { baseUrl: 'https://cap.example' })).toBeInstanceOf(
      PresignedS3DocumentUploadService,
    )
  })
})
