import { createLambdaHandler } from './lambda.js'
import { createApiDependencies } from './index.js'

/**
 * Production Lambda entrypoint (handler name: `handler.handler`).
 *
 * Wires the runtime configuration from the deployed environment into the
 * transport-neutral API Gateway adapter. Importing this module is side-effect
 * safe: `createApiDependencies` only reads `process.env`, and `index.ts` only
 * starts the local HTTP server when it is executed with `--serve`, which never
 * happens inside Lambda.
 */
export const handler = createLambdaHandler(createApiDependencies(process.env))
