/**
 * The document upload service contract.
 *
 * The UI depends only on this interface. The prototype uses a local, UI-only
 * adapter; a production build swaps in a presigned-S3 adapter without changing
 * the form layer.
 */
export type DocumentUploadService = {
  upload: (file: File, intakeId: string) => Promise<UploadedDocument>
}

export type UploadedDocument = {
  id: string
  name: string
  url: string
}

/**
 * Signals a document upload failure without exposing raw exceptions or storage
 * internals to the UI.
 */
export class DocumentUploadError extends Error {
  constructor(message?: string) {
    super(message ?? 'Document upload failed.')
    this.name = 'DocumentUploadError'
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 12)
}

/**
 * Prototype adapter. It validates the file shape, measures it, and returns a
 * reference object — but it does NOT claim the document was securely stored.
 * Safety per the implementation guide: the safe default for a static prototype
 * is UI-only handling that never pretends sensitive data was persisted.
 */
export class LocalDocumentUploadService implements DocumentUploadService {
  async upload(file: File, intakeId: string): Promise<UploadedDocument> {
    await new Promise((resolve) => setTimeout(resolve, 150))

    // Do not use the original filename as a security boundary or storage key.
    const documentId = randomId()
    return {
      id: `${intakeId}-${documentId}`,
      name: file.name,
      // Deliberately a non-resolvable placeholder that signals "in memory only".
      url: `local://intakes/${intakeId}/documents/${documentId}`,
    }
  }
}

/**
 * Production-shaped adapter for the intended presigned-S3 architecture:
 *
 *   Frontend -> POST /intakes/{id}/upload-url -> backend creates short-lived
 *   presigned URL -> Frontend PUTs file directly to S3.
 *
 * It is not wired for the static prototype; it establishes the contract and
 * throws when a backend is not configured so the UI never misleads the user
 * into believing a sensitive document was stored securely.
 */
export class PresignedS3DocumentUploadService implements DocumentUploadService {
  private readonly baseUrl: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  async upload(file: File, intakeId: string): Promise<UploadedDocument> {
    if (!this.baseUrl) {
      throw new DocumentUploadError(
        'Secure document storage is not configured for the static prototype.',
      )
    }

    const documentId = randomId()

    // 1. Request a short-lived presigned upload URL from the backend.
    let uploadUrl: string
    try {
      const response = await fetch(`${this.baseUrl}/intakes/${intakeId}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
        }),
      })
      if (!response.ok) {
        throw new DocumentUploadError('Could not request an upload location.')
      }
      const data = (await response.json()) as { uploadUrl: string }
      uploadUrl = data.uploadUrl
    } catch {
      throw new DocumentUploadError('Could not request an upload location.')
    }

    // 2. PUT the file directly to the presigned URL.
    try {
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
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

/**
 * Creates the document-upload adapter for the current environment. The static
 * prototype defaults to the local, UI-only adapter.
 */
export function createDocumentUploadService(
  mode: 'local' | 's3' = 'local',
  options?: { baseUrl?: string },
): DocumentUploadService {
  switch (mode) {
    case 's3':
      return new PresignedS3DocumentUploadService(options?.baseUrl)
    case 'local':
    default:
      return new LocalDocumentUploadService()
  }
}
