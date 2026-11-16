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
  localPresignerMode: 'signed' | 'mock'
  awsBucketName?: string
  awsRegion?: string
  /**
   * Enables the S3 presigner without static `AWS_ACCESS_KEY_ID` /
   * `AWS_SECRET_ACCESS_KEY` env values, relying on the SDK default credential
   * chain instead (the Lambda execution role on AWS, ambient env elsewhere).
   * Lambda reserves those credential keys, so serverless deployments set
   * `CAP_S3_ROLE_CREDENTIALS=1` rather than copying secrets into the function.
   */
  roleBasedS3: boolean
  /** Origins the browser API is allowed to call cross-origin. `*` reflects any origin. */
  allowedOrigins: string[]
  maxBodyBytes: number
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
}

export const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:5173',
  'https://cohealthinitiative.org',
  'https://www.cohealthinitiative.org',
  // Static S3 website host the frontend is deployed to while CloudFront
  // provisioning is blocked. CloudFront/OAC and an HTTPS custom domain remain
  // the production target.
  'http://cap-frontend-590251390266-us-east-2-an.s3-website.us-east-2.amazonaws.com',
]

function splitOrigins(value: string | undefined, fallback: string[]): string[] {
  if (value === undefined || value.trim() === '') return fallback
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function createConfig(
  env: Record<string, string | undefined> = process.env,
): ApiConfig {
  const port = Number(env['PORT'] ?? '8787')
  const localPresignerMode = env['CAP_LOCAL_PRESIGNER_MODE'] === 'mock' ? 'mock' : 'signed'
  return {
    port,
    publicBaseUrl: env['CAP_PUBLIC_BASE_URL'] ?? `http://127.0.0.1:${port}`,
    requireHttps: env['CAP_REQUIRE_HTTPS'] === 'true',
    uploadUrlExpirySeconds: Number(env['CAP_UPLOAD_URL_EXPIRY_SECONDS'] ?? '300'),
    presignSecret: env['CAP_UPLOAD_SIGNING_SECRET'] ?? 'cap-dev-only-signing-secret',
    localPresignerMode,
    awsBucketName: env['S3_BUCKET_NAME'] ?? env['CAP_S3_BUCKET_NAME'],
    awsRegion: env['AWS_REGION'] ?? env['AWS_DEFAULT_REGION'] ?? env['CAP_AWS_REGION'],
    roleBasedS3: env['CAP_S3_ROLE_CREDENTIALS'] === '1' || env['CAP_S3_ROLE_CREDENTIALS'] === 'true',
    allowedOrigins: splitOrigins(env['CAP_ALLOWED_ORIGINS'], DEFAULT_ALLOWED_ORIGINS),
    maxBodyBytes: Number(env['CAP_MAX_BODY_BYTES'] ?? String(12 * 1024 * 1024)),
    rateLimit: {
      windowMs: Number(env['CAP_RATE_LIMIT_WINDOW_MS'] ?? '60000'),
      maxRequests: Number(env['CAP_RATE_LIMIT_MAX_REQUESTS'] ?? '60'),
    },
  }
}