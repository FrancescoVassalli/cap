/**
 * Service registry / dependency-injection boundary.
 *
 * The form and its hooks consume services from here rather than instantiating
 * concrete adapters directly. This keeps business behavior behind the service
 * contracts and makes the eventual swap to a real backend a configuration
 * change rather than a rewrite of the intake UI.
 *
 * Selection is driven by the build mode and explicit `VITE_CAP_*` overrides:
 * development/test defaults to the static prototype, while production defaults
 * to the live API adapters. Tests and future environments can compose different
 * adapters without touching the form layer.
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
 * Live API Gateway endpoint for the deployed `cap-api` Lambda. Production
 * builds default to this endpoint so a deploy cannot silently fall back to the
 * in-memory mock; `VITE_CAP_API_BASE_URL` still overrides it for other
 * environments.
 */
export const DEFAULT_PRODUCTION_API_BASE_URL =
  'https://ah0jz85mlj.execute-api.us-east-2.amazonaws.com'

/**
 * Resolves the runtime adapter selection from Vite environment variables.
 * Development/test builds keep the static prototype (mock submission, local
 * document upload). Production builds call the live API and S3 upload flow by
 * default; `VITE_CAP_API_BASE_URL` can override the endpoint and explicit
 * `VITE_CAP_*` modes can still opt a build back into the prototype adapters.
 */
export function resolveServiceSelectionFromEnv(env: EnvLike = {}): ServiceSelection {
  const submissionMode = env['VITE_CAP_SUBMISSION_MODE']
  const uploadMode = env['VITE_CAP_UPLOAD_MODE']
  const configuredBaseUrl = env['VITE_CAP_API_BASE_URL']
  const isProductionBuild = env['MODE'] === 'production' || env['PROD'] === true

  const production: ServiceSelection['production'] = {}
  let hasProduction = false

  if (submissionMode === 'api' || submissionMode === 'email') {
    production.submission = submissionMode
    hasProduction = true
  } else if (isProductionBuild && submissionMode !== 'mock') {
    production.submission = 'api'
    hasProduction = true
  }

  if (uploadMode === 's3') {
    production.documentUpload = 's3'
    hasProduction = true
  } else if (isProductionBuild && uploadMode !== 'local') {
    production.documentUpload = 's3'
    hasProduction = true
  }

  if (hasProduction) {
    const baseUrl =
      typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim().length > 0
        ? configuredBaseUrl.trim()
        : DEFAULT_PRODUCTION_API_BASE_URL
    production.baseUrl = baseUrl.replace(/\/+$/, '')
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
 * Default service composition for the running app. Development/test builds use
 * the static prototype (mock submission, local UI-only document upload);
 * production builds use the live API/S3 adapters unless `VITE_CAP_*` overrides
 * opt out. Tests can build alternate compositions with `buildServices`.
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
