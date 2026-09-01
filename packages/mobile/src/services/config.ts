/**
 * Mobile service configuration.
 *
 * Mirrors the web app's `resolveServiceSelectionFromEnv` (which reads
 * `VITE_CAP_*`) using Expo's `EXPO_PUBLIC_*` environment variables, so the
 * mobile app can be pointed at the same backend as the web app without changing
 * the UI or the adapters. Defaults to the safe prototype (mock submission,
 * local UI-only document handling) when no backend is configured.
 *
 * No sensitive data is configured or logged here — this is transport config only.
 */

export type MobileSubmissionMode = 'mock' | 'api'
export type MobileUploadMode = 'local' | 'presigned'

export type MobileServiceConfig = {
  submissionMode: MobileSubmissionMode
  uploadMode: MobileUploadMode
  baseUrl: string
}

type EnvLike = Record<string, string | undefined>

export function resolveMobileServiceConfig(env: EnvLike = process.env): MobileServiceConfig {
  const submissionMode: MobileSubmissionMode = env['EXPO_PUBLIC_CAP_SUBMISSION_MODE'] === 'api' ? 'api' : 'mock'
  const uploadMode: MobileUploadMode =
    env['EXPO_PUBLIC_CAP_UPLOAD_MODE'] === 'presigned' ? 'presigned' : 'local'

  // `EXPO_PUBLIC_` env vars are treated as public config and bundled; this is
  // the backend's public base URL, not a secret. HTTPS is enforced by the
  // transport layer.
  const baseUrl = env['EXPO_PUBLIC_CAP_API_BASE_URL'] ?? ''

  return { submissionMode, uploadMode, baseUrl }
}

export const mobileServiceConfig: MobileServiceConfig = resolveMobileServiceConfig()
