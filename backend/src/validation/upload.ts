export const UPLOAD_LIMITS = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxTotalSizeBytes: 50 * 1024 * 1024,
  maxFileNameLength: 255,
  acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
}

const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

export type UploadMetadata = {
  fileName: string
  contentType: string
  size: number
}

export type UploadValidationResult = {
  errors: Record<string, string>
  metadata?: UploadMetadata
}

/**
 * Strips path separators and control characters from a submitted file name so
 * the stored metadata and object keys stay sanitized before persistence.
 */
export function sanitizeFileName(raw: string): string {
  return raw
    .replace(/[\\/]+/g, '')
    .replace(/^[\s.]+/, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, UPLOAD_LIMITS.maxFileNameLength)
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex === -1 ? '' : fileName.slice(dotIndex).toLowerCase()
}

/**
 * Validates document metadata before a presigned upload URL is issued. Enforces
 * the same per-file, total, and type limits the frontend applies, plus the
 * cumulative total for the intake so abuse cannot bypass the quota.
 */
export function validateUploadMetadata(
  input: Record<string, unknown>,
  totalExistingSize: number,
): UploadValidationResult {
  const errors: Record<string, string> = {}

  const fileName = sanitizeFileName(typeof input.fileName === 'string' ? input.fileName : '')
  const contentType =
    typeof input.contentType === 'string' && input.contentType.trim() !== ''
      ? input.contentType.trim()
      : DEFAULT_CONTENT_TYPE
  const size = typeof input.size === 'number' && Number.isFinite(input.size) ? Math.floor(input.size) : Number.NaN

  if (!fileName) errors.fileName = 'Document name is required.'
  if (!Number.isFinite(size) || size <= 0) {
    errors.size = 'File size is required.'
  } else if (size > UPLOAD_LIMITS.maxFileSizeBytes) {
    errors.size = 'File must be 10 MB or smaller.'
  } else if (totalExistingSize + size > UPLOAD_LIMITS.maxTotalSizeBytes) {
    errors.size = 'Total documents cannot exceed 50 MB.'
  }

  const extension = getExtension(fileName)
  const isAllowedType =
    UPLOAD_LIMITS.acceptedMimeTypes.includes(contentType) ||
    UPLOAD_LIMITS.acceptedExtensions.includes(extension)
  if (fileName && !isAllowedType) {
    errors.fileType = 'File type is not supported.'
  }

  if (Object.keys(errors).length > 0) return { errors }
  return { errors, metadata: { fileName, contentType, size } }
}