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
  const intakeId = request.query.get('intakeId') ?? undefined
  const validation = deps.presigner.verifyUploadUrl(documentId, token, intakeId)
  if (!validation.ok) {
    return json(403, {
      error: { code: 'invalid_signature', message: 'This upload link is invalid or has expired.' },
    })
  }

  // Mirror the production S3 contract: a direct PUT must carry the file bytes.
  // Without a body the upload handoff did not actually transfer content, so we
  // reject it instead of silently marking the document received. The bytes are
  // read for this check and then discarded — never logged or persisted.
  if (!request.body || Buffer.byteLength(request.body, 'utf8') === 0) {
    return json(400, {
      error: { code: 'empty_upload', message: 'The upload did not include any file content.' },
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