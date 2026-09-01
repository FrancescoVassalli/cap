import { randomUUID } from 'node:crypto'
import { json } from '../http.js'
import type { RouteHandler } from '../router.js'
import { validateUploadMetadata } from '../validation/upload.js'
import { isValidIntakeId } from './createIntake.js'
import type { DocumentRecord } from '../repository/store.js'

export const createUploadUrl: RouteHandler = async (request, deps) => {
  const intakeId = request.params.id ?? ''
  if (!isValidIntakeId(intakeId)) {
    return json(401, {
      error: { code: 'session_expired', message: 'This intake session has expired.' },
    })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(request.body ?? '{}') as Record<string, unknown>
  } catch {
    return json(422, { errors: { form: 'The request body must be valid JSON.' } })
  }

  const existingDocuments = await deps.store.listDocuments(intakeId)
  const totalSize = existingDocuments.reduce((sum, document) => sum + document.size, 0)
  const validated = validateUploadMetadata(body, totalSize)
  if (Object.keys(validated.errors).length > 0) return json(422, { errors: validated.errors })
  if (!validated.metadata) {
    return json(422, { errors: { form: 'Upload metadata is invalid.' } })
  }

  const documentId = randomUUID()
  const objectKey = `intakes/${intakeId}/documents/${documentId}`
  const location = await deps.presigner.createUploadLocation({
    intakeId,
    documentId,
    objectKey,
    fileName: validated.metadata.fileName,
    contentType: validated.metadata.contentType,
    size: validated.metadata.size,
  })

  const record: DocumentRecord = {
    intakeId,
    id: documentId,
    fileName: validated.metadata.fileName,
    contentType: validated.metadata.contentType,
    size: validated.metadata.size,
    objectKey,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  await deps.store.addDocument(record)
  deps.logger.log('info', 'upload-url-issued', { intakeId: record.intakeId, documentId })
  return json(200, { uploadUrl: location.url })
}