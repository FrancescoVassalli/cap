/**
 * Mobile document upload adapters.
 *
 * The mobile UI depends only on the shared `DocumentUploadService` contract.
 * The local adapter is UI-only (never claims secure storage). When a backend is
 * configured, the presigned adapter obtains a short-lived presigned upload URL
 * from the backend and PUTs the file bytes directly to storage — mirroring the
 * web app's `PresignedS3DocumentUploadService` and the backend's two-step flow.
 *
 * Security: no filename is used as a storage key or security boundary, and no
 * document bytes or names are ever logged.
 */

import { DocumentUploadError, type DocumentUploadService, type UploadedDocument, type UploadFileHandle } from '@cap/shared'

/**
 * True if the optional native byte transport is available. We lazily import
 * `expo-file-system`'s `File` class so this adapter can resolve in environments
 * where the module is absent, and we never bundle raw bytes into the contract.
 */
let nativeFileSupport: { File: new (uri: string) => Blob } | null | undefined
function getNativeFile(): { File: new (uri: string) => Blob } | null {
  if (nativeFileSupport !== undefined) return nativeFileSupport
  try {
    // expo-file-system v17 exposes the Web-compatible `File` class; `File`
    // extends `Blob`, so it can be used directly as a fetch body for the PUT.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-file-system') as { File?: new (uri: string) => Blob }
    nativeFileSupport = mod.File ? { File: mod.File } : null
  } catch {
    nativeFileSupport = null
  }
  return nativeFileSupport
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 12)
}

/**
 * Prototype adapter. Measures and returns a reference object for the selected
 * file but does NOT claim it was securely stored. This matches the web app's
 * safe default for a prototype: UI-only handling that never pretends sensitive
 * data was persisted.
 */
export class LocalDocumentUploadService implements DocumentUploadService {
  async upload(file: UploadFileHandle, intakeId: string): Promise<UploadedDocument> {
    await new Promise((resolve) => setTimeout(resolve, 150))
    const documentId = randomId()
    return {
      id: `${intakeId}-${documentId}`,
      name: file.name,
      url: `local://intakes/${intakeId}/documents/${documentId}`,
    }
  }
}

/**
 * Production-shaped adapter for the presigned-upload flow:
 *   Mobile -> POST /intakes/{id}/upload-url -> backend issues short-lived
 *   presigned URL -> Mobile PUTs the file bytes directly to storage.
 *
 * Transport-neutral at the boundary: the request layer and the file-body
 * factory are injectable for tests. The native byte PUT uses expo-file-system's
 * `File` when available; if no byte body can be produced the adapter throws
 * instead of silently sending an empty PUT (S3 rejects an empty-object handoff
 * and the local sink rejects it as `empty_upload`). Throws when no backend is
 * configured so the UI never misleads the user into thinking a sensitive
 * document was stored securely.
 */
export class PresignedUploadService implements DocumentUploadService {
  private readonly baseUrl: string
  private readonly requestImpl: (url: string, init: RequestInit) => Promise<Response>
  private readonly fileBodyFactory?: (uri: string) => Blob | undefined

  constructor(
    baseUrl = '',
    requestImpl?: (url: string, init: RequestInit) => Promise<Response>,
    fileBodyFactory?: (uri: string) => Blob | undefined,
  ) {
    this.baseUrl = baseUrl
    this.requestImpl = requestImpl ?? ((url, init) => globalThis.fetch(url, init))
    this.fileBodyFactory = fileBodyFactory
  }

  async upload(file: UploadFileHandle, intakeId: string): Promise<UploadedDocument> {
    if (!this.baseUrl) {
      throw new DocumentUploadError(
        'Secure document storage is not configured for the prototype.',
      )
    }

    const documentId = randomId()

    // 1. Request a short-lived presigned upload URL from the backend.
    let uploadUrl: string
    try {
      const response = await this.requestImpl(
        `${this.baseUrl}/intakes/${intakeId}/upload-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
          }),
        },
      )
      if (!response.ok) {
        throw new DocumentUploadError('Could not request an upload location.')
      }
      const data = (await response.json()) as { uploadUrl: string }
      uploadUrl = data.uploadUrl
    } catch {
      throw new DocumentUploadError('Could not request an upload location.')
    }

    // 2. Resolve the local file bytes and PUT them directly to the presigned URL.
    // A PUT without a body transfers no file content: S3 rejects an empty object
    // handoff, so refuse to send one rather than fail the upload with a generic
    // error after burning the short-lived presigned URL.
    const uri = file.uri
    if (!uri) {
      throw new DocumentUploadError('The document source is not available for upload.')
    }

    let body: Blob | undefined
    if (this.fileBodyFactory) {
      body = this.fileBodyFactory(uri)
    } else {
      const nativeFile = getNativeFile()
      body = nativeFile ? (new nativeFile.File(uri) as unknown as Blob) : undefined
    }
    if (!body) {
      throw new DocumentUploadError('The document source is not available for upload.')
    }

    try {
      const put = await this.requestImpl(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body,
      })
      if (!put.ok) {
        throw new DocumentUploadError('The document could not be uploaded.')
      }
    } catch {
      throw new DocumentUploadError('The document could not be uploaded.')
    }

    return {
      id: `${intakeId}-${documentId}`,
      name: file.name,
      url: `managed://intakes/${intakeId}/documents/${documentId}`,
    }
  }
}
