/**
 * Mobile service composition.
 *
 * This is the mobile equivalent of the web app's `src/services/index.ts`
 * dependency-injection boundary. The mobile screens never instantiate concrete
 * adapters directly; they consume services from here, keeping transport and
 * storage details out of the UI. It reuses the shared contracts from
 * `@cap/shared` and reads its runtime mode from `EXPO_PUBLIC_CAP_*` env vars
 * (mirroring the web app's `VITE_CAP_*` selection).
 */

import {
  MockSubmissionService,
  ApiSubmissionService,
  type SubmissionService,
  type ZipService,
  type DocumentUploadService,
} from '@cap/shared'
import { zipService as staticZipService } from './zip'
import { LocalDocumentUploadService, PresignedUploadService } from './documentUpload'
import { mobileServiceConfig, type MobileServiceConfig } from './config'

export type MobileServices = {
  zip: ZipService
  submission: SubmissionService
  documentUpload: DocumentUploadService
}

export type MobileServiceMode = 'mock' | 'api'

/**
 * Builds the mobile service set from an explicit config, defaulting to the
 * safe prototype.
 */
export function createMobileServices(
  config: MobileServiceConfig = mobileServiceConfig,
): MobileServices {
  const { submissionMode, uploadMode, baseUrl } = config

  const submission: SubmissionService =
    submissionMode === 'api' ? new ApiSubmissionService(baseUrl) : new MockSubmissionService()

  const documentUpload: DocumentUploadService =
    uploadMode === 'presigned'
      ? new PresignedUploadService(baseUrl)
      : new LocalDocumentUploadService()

  return {
    zip: staticZipService,
    submission,
    documentUpload,
  }
}

/** Default app-wide service set resolved from `EXPO_PUBLIC_CAP_*` env vars. */
export const mobileServices: MobileServices = createMobileServices()

export type { MobileServiceConfig }
export { mobileServiceConfig } from './config'
export { MockSubmissionService, ApiSubmissionService }
export type { SubmissionService, ZipService, DocumentUploadService }
