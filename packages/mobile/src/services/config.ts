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

/**
 * Resolves the runtime adapter selection from `EXPO_PUBLIC_CAP_*` env vars.
 *
 * IMPORTANT: the production path reads the vars through **direct
 * `process.env.EXPO_PUBLIC_*` property access**. Expo statically inlines those
 * specific MemberExpressions into the bundle at build time (see
 * `babel-preset-expo/build/inline-env-vars.js`), which is how the values from
 * `packages/mobile/.env` reach the running app. Reading through an aliased
 * variable (e.g. `env['EXPO_PUBLIC_…']` where `env` defaults to `process.env`)
 * is NOT inlined and silently kept the prototype defaults in the built app.
 *
 * The optional `env` argument exists only so unit tests can inject values
 * deterministically; it wins when it provides a value and otherwise falls back
 * to the inlined `process.env.EXPO_PUBLIC_*` literals.
 */
export function resolveMobileServiceConfig(env: EnvLike = {}): MobileServiceConfig {
  const rawSubmissionMode =
    env['EXPO_PUBLIC_CAP_SUBMISSION_MODE'] ?? process.env.EXPO_PUBLIC_CAP_SUBMISSION_MODE
  const rawUploadMode =
    env['EXPO_PUBLIC_CAP_UPLOAD_MODE'] ?? process.env.EXPO_PUBLIC_CAP_UPLOAD_MODE

  // `EXPO_PUBLIC_` env vars are treated as public config and bundled; this is
  // the backend's public base URL, not a secret. HTTPS is enforced by the
  // transport layer.
  const rawBaseUrl =
    env['EXPO_PUBLIC_CAP_API_BASE_URL'] ?? process.env.EXPO_PUBLIC_CAP_API_BASE_URL ?? ''

  return {
    submissionMode: rawSubmissionMode === 'api' ? 'api' : 'mock',
    uploadMode: rawUploadMode === 'presigned' ? 'presigned' : 'local',
    baseUrl: rawBaseUrl,
  }
}

export const mobileServiceConfig: MobileServiceConfig = resolveMobileServiceConfig()
