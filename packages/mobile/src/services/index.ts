/**
 * Mobile service composition.
 *
 * This is the mobile equivalent of the web app's `src/services/index.ts`
 * dependency-injection boundary. The mobile screens never instantiate concrete
 * adapters directly; they consume services from here, keeping transport and
 * storage details out of the UI. It reuses the shared contracts from
 * `@cap/shared`.
 */

import {
  MockSubmissionService,
  ApiSubmissionService,
  type SubmissionService,
  type ZipService,
  type DocumentUploadService,
} from '@cap/shared'
import { zipService as staticZipService } from './zip'
import { LocalDocumentUploadService } from './documentUpload'

export type MobileServices = {
  zip: ZipService
  submission: SubmissionService
  documentUpload: DocumentUploadService
}

export type MobileServiceMode = 'mock' | 'api'

/**
 * Builds the mobile service set. Defaults to mock/local for the prototype.
 * Pass `mode: { submission: 'api', baseUrl }` to attach a real backend.
 */
export function createMobileServices(options?: {
  submissionMode?: MobileServiceMode
  baseUrl?: string
}): MobileServices {
  const { submissionMode = 'mock', baseUrl = '' } = options ?? {}

  const submission: SubmissionService =
    submissionMode === 'api' ? new ApiSubmissionService(baseUrl) : new MockSubmissionService()

  return {
    zip: staticZipService,
    submission,
    documentUpload: new LocalDocumentUploadService(),
  }
}

export const mobileServices: MobileServices = createMobileServices()

export { MockSubmissionService, ApiSubmissionService }
export type { SubmissionService, ZipService, DocumentUploadService }
