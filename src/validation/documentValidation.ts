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

  // The shared validator returns the original candidate objects it accepted.
  // Match by identity so duplicate name+size files are not both treated as
  // accepted when only one of them passed the type/size/total checks.
  const acceptedCandidates = new Set<unknown>(result.accepted)
  const accepted = files.filter((file) => acceptedCandidates.has(file))

  return { accepted, errors: result.errors }
}