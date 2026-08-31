import type { ApiConfig } from './config.js'
import type { ApiLogger } from './logging.js'
import type { RateLimiter } from './rateLimit.js'
import type { UploadUrlPresigner } from './presigner/presigner.js'
import type { Store } from './repository/store.js'

/**
 * Everything a handler needs to do its job. Kept as a single plain object so
 * tests can build the API without global state and Lambda deployments can
 * construct the same dependencies from environment-managed services.
 */
export type ApiDependencies = {
  config: ApiConfig
  store: Store
  presigner: UploadUrlPresigner
  logger: ApiLogger
  rateLimiter: RateLimiter
}