import { createHmac, timingSafeEqual } from 'node:crypto'
import type { ApiConfig } from '../config.js'
import type {
  CreateUploadLocationInput,
  UploadLocation,
  UploadUrlPresigner,
  UploadUrlValidation,
} from './presigner.js'

function encodePayload(payload: string): string {
  return Buffer.from(payload, 'utf8').toString('base64url')
}

function decodePayload(encoded: string): string {
  return Buffer.from(encoded, 'base64url').toString('utf8')
}

function signaturesEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Local dev presigner. The returned URL is signed by this API itself so a
 * browser can PUT the file bytes back to the same server in the exact shape
 * the production S3 flow will use. Production replaces this implementation
 * with an S3 presigner; the handler contract does not change.
 */
export function createLocalPresigner(
  config: Pick<ApiConfig, 'publicBaseUrl' | 'uploadUrlExpirySeconds' | 'presignSecret'>,
): UploadUrlPresigner {
  function sign(payload: string): string {
    return createHmac('sha256', config.presignSecret).update(payload).digest('hex')
  }

  return {
    createUploadLocation(input: CreateUploadLocationInput): UploadLocation {
      const { intakeId, documentId, objectKey } = input
      const expiresAt = Date.now() + config.uploadUrlExpirySeconds * 1000
      const payload = `${intakeId}:${documentId}:${expiresAt}`
      const token = `${encodePayload(payload)}.${sign(payload)}`
      const url = `${config.publicBaseUrl}/uploads/${documentId}?token=${encodeURIComponent(token)}`
      return { url, objectKey, expiresAt: new Date(expiresAt) }
    },
    verifyUploadUrl(documentId: string, token: string): UploadUrlValidation {
      const separatorIndex = token.indexOf('.')
      if (separatorIndex === -1) return { ok: false }
      const [encodedPayload, providedSignature] = [
        token.slice(0, separatorIndex),
        token.slice(separatorIndex + 1),
      ]
      let payload: string
      try {
        payload = decodePayload(encodedPayload)
      } catch {
        return { ok: false }
      }
      const [intakeId, embeddedDocumentId, expiry] = payload.split(':')
      if (embeddedDocumentId !== documentId) return { ok: false }
      const expected = Buffer.from(sign(payload), 'hex')
      const provided = Buffer.from(providedSignature, 'hex')
      if (!signaturesEqual(expected, provided)) return { ok: false }
      const expiresAt = Number(expiry)
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return { ok: false }
      return { ok: true, intakeId, documentId }
    },
  }
}