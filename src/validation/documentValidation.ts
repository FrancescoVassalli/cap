/**
 * Web document validation.
 *
 * The per-file / total-size / type / duplicate rules live in `@cap/shared`, so
 * the web and mobile apps enforce identical upload limits. This module keeps the
 * browser-specific `File[]` entry point and maps the shared validation result
 * back to the original `File` objects.
 */

import type { AllContent } from '@/content'
import type { IntakeDocument } from '@/types/index'
import { validateDocumentCandidates } from '@cap/shared'
import { DOCUMENT_CONFIG } from '@cap/shared'

export type DocumentValidationResult = {
  accepted: File[]
  errors: string[]
}

export { DOCUMENT_CONFIG }

/**
 * Validates browser `File` objects against the shared rules. Accepted files are
 * the original `File` instances (the shared validator works on the
 * name/size/type metadata the rules need).
 */
export function validateDocumentFiles(
  files: File[],
  existingDocuments: IntakeDocument[],
  content: AllContent,
): DocumentValidationResult {
  const errorMessages = content.intakeForm.errors
  const result = validateDocumentCandidates(files, existingDocuments, errorMessages)

  // The shared validator dedupes by name+size within the batch, so mapping each
  // accepted candidate back to its original File is unambiguous.
  const acceptedKeys = new Set(result.accepted.map((file) => `${file.name}-${file.size}`))
  const accepted = files.filter((file) => acceptedKeys.has(`${file.name}-${file.size}`))

  return { accepted, errors: result.errors }
}