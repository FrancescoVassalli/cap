import { useCallback } from 'react'
import { services, type Services } from '@/services'
import type { IntakeDocument } from '@/types/index'

export type UploadState = 'idle' | 'uploading' | 'error'

export type UploadedIntakeDocument = {
  document: IntakeDocument
  error: boolean
}

/**
 * Hook that encapsulates document upload behind the upload service boundary.
 *
 * It converts an accepted File into the IntakeDocument shape the form stores,
 * so the DocumentsStep no longer instantiates the upload adapter directly.
 */
export function useDocumentUpload(deps: Services = services) {
  const upload = useCallback(
    async (file: File, intakeId: string): Promise<UploadedIntakeDocument> => {
      try {
        const uploaded = await deps.documentUpload.upload(file, intakeId)
        return {
          document: {
            id: uploaded.id,
            name: uploaded.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
          },
          error: false,
        }
      } catch {
        return { document: {} as IntakeDocument, error: true }
      }
    },
    [deps.documentUpload],
  )

  return { upload }
}
