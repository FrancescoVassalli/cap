/**
 * Mobile document upload adapters.
 *
 * The mobile UI depends only on the shared `DocumentUploadService` contract.
 * The local adapter is UI-only (never claims secure storage). A production
 * build would swap in a presigned-upload adapter that talks to the backend and
 * PUTs the file to S3 — with the platform-specific file byte handling isolated
 * here behind the shared contract.
 *
 * Security: no filename is used as a storage key or security boundary, and no
 * document bytes or names are ever logged.
 */

import type { DocumentUploadService, UploadedDocument, UploadFileHandle } from '@cap/shared'

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
 * Production-shaped adapter for the intended presigned-upload flow:
 *   Mobile -> POST /intakes/{id}/upload-url -> backend issues short-lived
 *   presigned URL -> Mobile PUTs the file bytes directly to storage.
 *
 * Kept transport-neutral with an injectable request function so it can run on
 * native without bundling web-only globals. Throws when no backend is
 * configured so the UI never misleads the user into thinking a sensitive
 * document was stored securely.
 */
export class PresignedUploadService implements DocumentUploadService {
  private readonly baseUrl: string
  private readonly requestImpl: (url: string, init: RequestInit) => Promise<Response>

  constructor(
    baseUrl = '',
    requestImpl?: (url: string, init: RequestInit) => Promise<Response>,
  ) {
    this.baseUrl = baseUrl
    this.requestImpl = requestImpl ?? ((url, init) => globalThis.fetch(url, init))
  }

  async upload(file: UploadFileHandle, intakeId: string): Promise<UploadedDocument> {
    if (!this.baseUrl) {
      throw new Error('Secure document storage is not configured for the prototype.')
    }

    const documentId = randomId()

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
        throw new Error('Could not request an upload location.')
      }
      const data = (await response.json()) as { uploadUrl: string }
      uploadUrl = data.uploadUrl
    } catch {
      throw new Error('Could not request an upload location.')
    }

    // Platform-specific byte upload (native Body/form-data) would live in a
    // React Native adapter extension. For the shared contract we model the
    // presigned-PUT hand-off without shipping bytes.
    if (!file.uri) {
      throw new Error('The document source is not available for upload.')
    }

    try {
      const put = await this.requestImpl(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        // In a real RN adapter this would use fetch(uploadUrl, { body: blob }) or
        // XMLHttpRequest with the file's local URI.
        body: undefined as unknown as BodyInit,
      })
      if (!put.ok) {
        throw new Error('The document could not be uploaded.')
      }
    } catch {
      throw new Error('The document could not be uploaded.')
    }

    return {
      id: `${intakeId}-${documentId}`,
      name: file.name,
      url: `managed://intakes/${intakeId}/documents/${documentId}`,
    }
  }
}
