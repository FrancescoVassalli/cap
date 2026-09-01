import type { Server } from 'node:http'
import { createApiServer } from './server.js'
import { createConfig } from './config.js'
import { createApiLogger } from './logging.js'
import { createRateLimiter } from './rateLimit.js'
import { createMemoryStore } from './repository/memoryStore.js'
import { createLocalPresigner } from './presigner/localPresigner.js'
import { createS3Presigner } from './presigner/s3Presigner.js'
import type { ApiDependencies } from './context.js'

export { createApiServer } from './server.js'
export { createLambdaHandler, type LambdaEvent, type LambdaResult } from './lambda.js'

export function createApiDependencies(
  env: Record<string, string | undefined> = process.env,
): ApiDependencies {
  const config = createConfig(env)
  const logger = createApiLogger()

  // Deterministic at startup: the S3 presigner is only selected when a bucket,
  // region, and credentials are all present. Otherwise we fall back to the
  // local presigner so development and CI keep working without AWS. Because the
  // browser then PUTs to a localhost URL that reads-and-discards the bytes (it
  // cannot reach S3), we emit a warning whenever the frontend expects S3 but the
  // backend is actually running locally, so a "silent discard" is never hidden.
  const useS3 =
    config.localPresignerMode !== 'mock' &&
    Boolean(config.awsBucketName) &&
    Boolean(config.awsRegion) &&
    Boolean(env['AWS_ACCESS_KEY_ID']) &&
    Boolean(env['AWS_SECRET_ACCESS_KEY'])
  const presigner = useS3 ? createS3Presigner(config) : createLocalPresigner(config)

  logger.log(
    useS3 ? 'info' : 'warn',
    useS3 ? 'presigner-s3-active' : 'presigner-local-active',
    useS3
      ? { bucket: config.awsBucketName ?? '', region: config.awsRegion ?? '' }
      : { localMode: config.localPresignerMode },
  )

  return {
    config,
    store: createMemoryStore(),
    presigner,
    logger,
    rateLimiter: createRateLimiter(config.rateLimit),
  }
}

/**
 * Loads the gitignored root `.env` file into `process.env` for local
 * development. Deployment-specific values (S3 bucket, region, credentials, the
 * signing secret) live in `.env`, which Vite already loads for the frontend;
 * this mirrors that so the local Node server honors the same configuration.
 *
 * Existing environment variables always win, so a deployment that injects
 * real values through its orchestrator is never overridden. This runs only
 * when serving locally; it is intentionally not part of `createApiDependencies`
 * so tests and the Lambda adapter keep driving configuration explicitly.
 */
export function loadLocalDotEnv(cwd: string = process.cwd()): void {
  try {
    // Node >=20.6 built-in loader; does not override already-set variables.
    process.loadEnvFile(`${cwd}/.env`)
  } catch {
    // No `.env` present (or unreadable) — fall back to the ambient environment.
  }
}

/**
 * Entrypoint for the local development server. Dependencies are built from the
 * environment and swapped for durable services in a production deployment.
 */
export function startServer(deps: ApiDependencies = createApiDependencies()): Server {
  const server = createApiServer(deps)
  server.listen(deps.config.port, () => {
    deps.logger.log('info', 'server-started', { port: deps.config.port })
  })
  return server
}

if (process.argv.includes('--serve')) {
  loadLocalDotEnv()
  startServer()
}