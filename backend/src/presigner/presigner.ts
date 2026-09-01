export type CreateUploadLocationInput = {
  intakeId: string
  documentId: string
  objectKey: string
  fileName: string
  contentType: string
  size: number
}

export type UploadLocation = {
  url: string
  objectKey: string
  expiresAt: Date
}

export type UploadUrlValidation =
  | { ok: true; intakeId: string; documentId: string }
  | { ok: false }

/**
 * Produces short-lived upload URLs for documents and verifies upload callbacks.
 * The local implementation returns a signed URL handled by this API so local
 * development and tests exercise the real presigned-URL flow; an S3
 * implementation replaces it with AWS Signature V4 URLs.
 */
export type UploadUrlPresigner = {
  createUploadLocation: (input: CreateUploadLocationInput) => Promise<UploadLocation>
  verifyUploadUrl: (documentId: string, token: string, intakeId?: string) => UploadUrlValidation
}