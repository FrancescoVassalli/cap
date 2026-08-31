/**
 * Runtime configuration for the CAP API. Values are read from the process
 * environment so secrets and deployment-specific settings never reach the
 * frontend bundle. The signing secret below is a dev-only fallback; production
 * deployments must provide `CAP_UPLOAD_SIGNING_SECRET` through the
 * environment-managed secret store.
 */
export type ApiConfig = {
  port: number
  publicBaseUrl: string
  requireHttps: boolean
  uploadUrlExpirySeconds: number
  presignSecret: string
  maxBodyBytes: number
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
}

export function createConfig(
  env: Record<string, string | undefined> = process.env,
): ApiConfig {
  const port = Number(env['PORT'] ?? '8787')
  return {
    port,
    publicBaseUrl: env['CAP_PUBLIC_BASE_URL'] ?? `http://127.0.0.1:${port}`,
    requireHttps: env['CAP_REQUIRE_HTTPS'] === 'true',
    uploadUrlExpirySeconds: Number(env['CAP_UPLOAD_URL_EXPIRY_SECONDS'] ?? '300'),
    presignSecret: env['CAP_UPLOAD_SIGNING_SECRET'] ?? 'cap-dev-only-signing-secret',
    maxBodyBytes: Number(env['CAP_MAX_BODY_BYTES'] ?? String(12 * 1024 * 1024)),
    rateLimit: {
      windowMs: Number(env['CAP_RATE_LIMIT_WINDOW_MS'] ?? '60000'),
      maxRequests: Number(env['CAP_RATE_LIMIT_MAX_REQUESTS'] ?? '60'),
    },
  }
}