import { describe, expect, it } from 'vitest'
import {
  createServices,
  resolveServiceSelectionFromEnv,
  type EnvLike,
} from './index'
import { ApiSubmissionService, MockSubmissionService } from './submissionService'
import { LocalDocumentUploadService, PresignedS3DocumentUploadService } from './documentUploadService'

describe('resolveServiceSelectionFromEnv', () => {
  it('defaults to the static-prototype mocks when no env vars are set', () => {
    expect(resolveServiceSelectionFromEnv({})).toEqual({})
  })

  it('selects the api submission adapter from the submission mode env var', () => {
    const selection = resolveServiceSelectionFromEnv({
      'VITE_CAP_SUBMISSION_MODE': 'api',
      'VITE_CAP_API_BASE_URL': 'https://cap.example',
    } as EnvLike)
    expect(selection.production).toMatchObject({
      submission: 'api',
      baseUrl: 'https://cap.example',
    })
  })

  it('selects the s3 upload adapter from the upload mode env var', () => {
    const selection = resolveServiceSelectionFromEnv({ 'VITE_CAP_UPLOAD_MODE': 's3' } as EnvLike)
    expect(selection.production).toMatchObject({ documentUpload: 's3' })
  })

  it('ignores unrecognized modes and keeps the mock default', () => {
    expect(
      resolveServiceSelectionFromEnv({ 'VITE_CAP_SUBMISSION_MODE': 'carrier-pigeon' } as EnvLike),
    ).toEqual({})
  })
})

describe('createServices', () => {
  it('composes the static-prototype adapters by default', () => {
    const services = createServices()
    expect(services.submission).toBeInstanceOf(MockSubmissionService)
    expect(services.documentUpload).toBeInstanceOf(LocalDocumentUploadService)
  })

  it('composes the production adapters from an explicit selection', () => {
    const services = createServices({
      production: {
        submission: 'api',
        documentUpload: 's3',
        baseUrl: 'https://cap.example',
      },
    })
    expect(services.submission).toBeInstanceOf(ApiSubmissionService)
    expect(services.documentUpload).toBeInstanceOf(PresignedS3DocumentUploadService)
  })
})