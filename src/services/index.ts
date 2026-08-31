/**
 * Service registry / dependency-injection boundary.
 *
 * The form and its hooks consume services from here rather than instantiating
 * concrete adapters directly. This keeps business behavior behind the service
 * contracts and makes the eventual swap to a real backend a configuration
 * change rather than a rewrite of the intake UI.
 *
 * Selection is driven by an explicit mode (defaulting to the static prototype)
 * so tests and future environments can compose different adapters without
 * touching the form layer.
 */
import { createSubmissionService, type SubmissionService } from './submissionService'
import { zipService, type ZipService } from './zipService'
import { createDocumentUploadService, type DocumentUploadService } from './documentUploadService'

export type ServiceMode = 'mock' | 'local'
export type ProductionServiceMode = 'email' | 'api' | 's3'

export type ServiceSelection = {
  /** Static-prototype mode: in-memory adapters. */
  mode?: ServiceMode
  /** Production adapter configuration when a backend exists. */
  production?: {
    submission?: 'email' | 'api'
    documentUpload?: 's3'
    recipient?: string
    baseUrl?: string
  }
}

export type Services = {
  zip: ZipService
  submission: SubmissionService
  documentUpload: DocumentUploadService
}

export type EnvLike = Record<string, unknown>

/**
 * Resolves the runtime adapter selection from Vite environment variables.
 * The static prototype remains the default; `VITE_CAP_SUBMISSION_MODE` =
 * `api`, `VITE_CAP_UPLOAD_MODE` = `s3`, and `VITE_CAP_API_BASE_URL` select the
 * real backend without changing the form layer or the adapter contracts.
 */
export function resolveServiceSelectionFromEnv(env: EnvLike = {}): ServiceSelection {
  const submissionMode = env['VITE_CAP_SUBMISSION_MODE']
  const uploadMode = env['VITE_CAP_UPLOAD_MODE']
  const baseUrl = env['VITE_CAP_API_BASE_URL']

  const production: ServiceSelection['production'] = {}
  let hasProduction = false

  if (submissionMode === 'api' || submissionMode === 'email') {
    production.submission = submissionMode
    hasProduction = true
  }
  if (uploadMode === 's3') {
    production.documentUpload = 's3'
    hasProduction = true
  }
  if (typeof baseUrl === 'string' && baseUrl.length > 0) {
    production.baseUrl = baseUrl
  }

  return hasProduction ? { production } : {}
}

function buildServices(selection: ServiceSelection = {}): Services {
  const prod = selection.production
  // Static-prototype modes ('mock' | 'local') both map to the in-memory
  // submission adapter; production selections override the concrete adapter.
  const submissionMode = prod?.submission ?? 'mock'
  const uploadMode = prod?.documentUpload ?? 'local'

  return {
    zip: zipService,
    submission: createSubmissionService(submissionMode, {
      recipient: prod?.recipient,
      baseUrl: prod?.baseUrl,
    }),
    documentUpload: createDocumentUploadService(uploadMode, {
      baseUrl: prod?.baseUrl,
    }),
  }
}

/**
 * Default service composition for the running app. Mode selection is driven by
 * `VITE_CAP_*` environment variables and falls back to the static prototype
 * (mock submission, local UI-only document upload) when no backend is
 * configured. Tests can build alternate compositions with `buildServices`.
 */
export const services: Services = buildServices(
  resolveServiceSelectionFromEnv(import.meta.env satisfies EnvLike),
)

/**
 * Composes a set of services from an explicit selection. Useful for tests and
 * for environments that need a specific production adapter.
 */
export function createServices(selection: ServiceSelection = {}): Services {
  return buildServices(selection)
}

export type { SubmissionService, ZipService, DocumentUploadService }
export { SubmissionError } from './submissionService'
export { DocumentUploadError } from './documentUploadService'
