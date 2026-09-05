import { describe, expect, it, vi } from 'vitest'
import type { UploadFileHandle } from '@cap/shared'
import { DocumentUploadError } from '@cap/shared'
import { LocalDocumentUploadService, PresignedUploadService } from './documentUpload'

const pick = (overrides: Partial<UploadFileHandle> = {}): UploadFileHandle => ({
  name: 'denial-letter.pdf',
  size: 1024,
  type: 'application/pdf',
  uri: 'file:///tmp/denial-letter.pdf',
  ...overrides,
})

type RequestStub = (url: string, init: RequestInit) => Promise<Response>

/** Simulates the native expo-file-system `File` byte body on this platform. */
const fileBodyFactory = () => new Blob([new ArrayBuffer(64)])

function fakeResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('LocalDocumentUploadService', () => {
  it('returns a local reference id/url for the prototype flow', async () => {
    const service = new LocalDocumentUploadService()
    const uploaded = await service.upload(pick(), 'intake-1')
    expect(uploaded.id.startsWith('intake-1-')).toBe(true)
    expect(uploaded.url.startsWith('local://intakes/intake-1/documents/')).toBe(true)
    expect(uploaded.name).toBe('denial-letter.pdf')
  })
})

describe('PresignedUploadService', () => {
  it('throws without a base URL instead of claiming secure storage', async () => {
    const service = new PresignedUploadService('', vi.fn())
    await expect(service.upload(pick(), 'intake-1')).rejects.toBeInstanceOf(DocumentUploadError)
  })

  it('requests an upload location then PUTs the file bytes to the presigned URL', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const requestImpl: RequestStub = async (url, init) => {
      calls.push({ url, init })
      if (init.method === 'POST') {
        expect(url).toBe('https://cap.example/intakes/intake-1/upload-url')
        const body = JSON.parse(init.body as string)
        expect(body).toMatchObject({
          fileName: 'denial-letter.pdf',
          contentType: 'application/pdf',
          size: 1024,
        })
        return fakeResponse(200, { uploadUrl: 'https://presigned.example/upload' })
      }
      expect(init.method).toBe('PUT')
      expect(url).toBe('https://presigned.example/upload')
      expect(init.headers).toMatchObject({ 'Content-Type': 'application/pdf' })
      expect((init.body as Blob).size).toBeGreaterThan(0)
      return fakeResponse(200)
    }

    const service = new PresignedUploadService('https://cap.example', requestImpl, fileBodyFactory)
    const uploaded = await service.upload(pick(), 'intake-1')

    expect(uploaded.id.startsWith('intake-1-')).toBe(true)
    expect(uploaded.url.startsWith('managed://intakes/intake-1/documents/')).toBe(true)
    expect(calls.map((call) => call.url)).toEqual([
      'https://cap.example/intakes/intake-1/upload-url',
      'https://presigned.example/upload',
    ])
  })

  it('includes the content type in the PUT when the picked file has no mime type', async () => {
    let putInit: RequestInit | undefined
    const requestImpl: RequestStub = async (url, init) => {
      if (init.method === 'POST') return fakeResponse(200, { uploadUrl: 'https://presigned.example/upload' })
      putInit = init
      return fakeResponse(200)
    }
    const service = new PresignedUploadService('https://cap.example', requestImpl, fileBodyFactory)
    await service.upload(pick({ type: undefined }), 'intake-1')
    expect(putInit?.headers).toMatchObject({ 'Content-Type': 'application/octet-stream' })
    expect((putInit?.body as Blob).size).toBeGreaterThan(0)
  })

  it('maps a rejected upload-location request to a DocumentUploadError', async () => {
    const service = new PresignedUploadService('https://cap.example', async () => {
      throw new Error('network down')
    })
    await expect(service.upload(pick(), 'intake-1')).rejects.toBeInstanceOf(DocumentUploadError)
  })

  it('maps a failed upload-location response to a DocumentUploadError', async () => {
    const service = new PresignedUploadService('https://cap.example', async () => fakeResponse(500))
    await expect(service.upload(pick(), 'intake-1')).rejects.toBeInstanceOf(DocumentUploadError)
  })

  it('throws when the picked file has no uri to upload', async () => {
    const requestImpl: RequestStub = async (url, init) => {
      if (init.method === 'POST') return fakeResponse(200, { uploadUrl: 'https://presigned.example/upload' })
      return fakeResponse(200)
    }
    const service = new PresignedUploadService('https://cap.example', requestImpl)
    await expect(service.upload(pick({ uri: undefined }), 'intake-1')).rejects.toThrow('not available')
  })

  it('maps a rejected byte PUT to a DocumentUploadError', async () => {
    const requestImpl: RequestStub = async (url, init) =>
      init.method === 'POST' ? fakeResponse(200, { uploadUrl: 'https://presigned.example/upload' }) : (() => {
        throw new Error('storage down')
      })()
    const service = new PresignedUploadService('https://cap.example', requestImpl, fileBodyFactory)
    await expect(service.upload(pick(), 'intake-1')).rejects.toBeInstanceOf(DocumentUploadError)
  })

  it('throws instead of sending an empty PUT when no byte body can be produced', async () => {
    let putInit: RequestInit | undefined
    const requestImpl: RequestStub = async (url, init) => {
      if (init.method === 'POST') return fakeResponse(200, { uploadUrl: 'https://presigned.example/upload' })
      putInit = init
      return fakeResponse(200)
    }
    // No injected file factory and expo-file-system is not resolvable in this
    // node environment, so the native byte transport is unavailable: the
    // adapter must refuse the empty PUT (S3/local sink both reject it) instead
    // of burning the presigned URL with `body: undefined`.
    const service = new PresignedUploadService('https://cap.example', requestImpl)
    await expect(service.upload(pick(), 'intake-1')).rejects.toBeInstanceOf(DocumentUploadError)
    expect(putInit).toBeUndefined()
  })
})