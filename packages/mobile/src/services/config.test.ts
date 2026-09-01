import { describe, expect, it } from 'vitest'
import { resolveMobileServiceConfig } from './config'

describe('resolveMobileServiceConfig', () => {
  it('defaults to the safe prototype when no env vars are set', () => {
    expect(resolveMobileServiceConfig({})).toEqual({
      submissionMode: 'mock',
      uploadMode: 'local',
      baseUrl: '',
    })
  })

  it('selects API submission and presigned upload when configured', () => {
    expect(
      resolveMobileServiceConfig({
        EXPO_PUBLIC_CAP_SUBMISSION_MODE: 'api',
        EXPO_PUBLIC_CAP_UPLOAD_MODE: 'presigned',
        EXPO_PUBLIC_CAP_API_BASE_URL: 'https://cap-api.example.com',
      }),
    ).toEqual({
      submissionMode: 'api',
      uploadMode: 'presigned',
      baseUrl: 'https://cap-api.example.com',
    })
  })

  it('ignores unknown modes instead of enabling a partial config', () => {
    expect(
      resolveMobileServiceConfig({
        EXPO_PUBLIC_CAP_SUBMISSION_MODE: 'carrier-pigeon',
        EXPO_PUBLIC_CAP_UPLOAD_MODE: 'teleport',
      }),
    ).toEqual({ submissionMode: 'mock', uploadMode: 'local', baseUrl: '' })
  })

  it('keeps an empty base URL when only the mode is set', () => {
    expect(
      resolveMobileServiceConfig({ EXPO_PUBLIC_CAP_SUBMISSION_MODE: 'api' }),
    ).toEqual({ submissionMode: 'api', uploadMode: 'local', baseUrl: '' })
  })
})