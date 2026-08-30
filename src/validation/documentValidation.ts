import type { AllContent } from '@/content'
import type { IntakeDocument } from '@/types/index'

export const DOCUMENT_CONFIG = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxTotalSizeBytes: 50 * 1024 * 1024,
  acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] as string[],
  acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'] as string[],
} as const

export type DocumentValidationResult = {
  accepted: File[]
  errors: string[]
}

function getFileExtension(name: string): string {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex === -1) return ''
  return name.slice(dotIndex).toLowerCase()
}

export function validateDocumentFiles(
  files: File[],
  existingDocuments: IntakeDocument[],
  content: AllContent,
): DocumentValidationResult {
  const accepted: File[] = []
  const errors: string[] = []
  const errorMessages = content.intakeForm.errors
  const existingKeys = new Set(existingDocuments.map((document) => `${document.name}-${document.size}`))
  const batchKeys = new Set<string>()
  let totalSize = existingDocuments.reduce((sum, document) => sum + document.size, 0)

  for (const file of files) {
    const extension = getFileExtension(file.name)
    const isAllowedType =
      DOCUMENT_CONFIG.acceptedMimeTypes.includes(file.type) ||
      DOCUMENT_CONFIG.acceptedExtensions.includes(extension)

    if (!isAllowedType) {
      errors.push(errorMessages.invalidFileType)
      continue
    }

    if (file.size > DOCUMENT_CONFIG.maxFileSizeBytes) {
      errors.push(errorMessages.fileTooLarge)
      continue
    }

    const key = `${file.name}-${file.size}`
    if (existingKeys.has(key) || batchKeys.has(key)) {
      errors.push(errorMessages.duplicateFile)
      continue
    }

    if (totalSize + file.size > DOCUMENT_CONFIG.maxTotalSizeBytes) {
      errors.push(errorMessages.totalSizeTooLarge)
      continue
    }

    batchKeys.add(key)
    totalSize += file.size
    accepted.push(file)
  }

  return { accepted, errors }
}