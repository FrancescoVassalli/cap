import { json } from '../http.js'
import type { RouteHandler } from '../router.js'

/**
 * Local-mode upload sink. In production the presigned URL points at S3 and the
 * browser PUTs the file directly there; this endpoint only exists so the local
 * presigner can return a usable URL that mirrors the same two-step flow. File
 * bytes are read for validation and then discarded, never logged or stored.
 */
export const receiveUpload: RouteHandler = async (request, deps) => {
  const documentId = request.params.id ?? ''
  const token = request.query.get('token') ?? ''
  const validation = deps.presigner.verifyUploadUrl(documentId, token)
  if (!validation.ok) {
    return json(403, {
      error: { code: 'invalid_signature', message: 'This upload link is invalid or has expired.' },
    })
  }

  const updated = await deps.store.markDocumentUploaded(validation.intakeId, documentId)
  if (!updated) {
    return json(404, { error: { code: 'not_found', message: 'Upload record not found.' } })
  }

  deps.logger.log('info', 'document-received', {
    intakeId: updated.intakeId,
    documentId: updated.id,
  })
  return json(200, { status: 'uploaded' })
}