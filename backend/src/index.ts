import type { Server } from 'node:http'
import { createApiServer } from './server.js'
import { createConfig } from './config.js'
import { createApiLogger } from './logging.js'
import { createRateLimiter } from './rateLimit.js'
import { createMemoryStore } from './repository/memoryStore.js'
import { createLocalPresigner } from './presigner/localPresigner.js'
import type { ApiDependencies } from './context.js'

export { createApiServer } from './server.js'
export { createLambdaHandler, type LambdaEvent, type LambdaResult } from './lambda.js'

export function createApiDependencies(
  env: Record<string, string | undefined> = process.env,
): ApiDependencies {
  const config = createConfig(env)
  return {
    config,
    store: createMemoryStore(),
    presigner: createLocalPresigner(config),
    logger: createApiLogger(),
    rateLimiter: createRateLimiter(config.rateLimit),
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
  startServer()
}