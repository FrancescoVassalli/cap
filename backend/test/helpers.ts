import { once } from 'node:events'
import { createServer as createNetServer } from 'node:net'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApiServer } from '../src/server.js'
import { createConfig, type ApiConfig } from '../src/config.js'
import { createMemoryStore, type MemoryStore } from '../src/repository/memoryStore.js'
import { createLocalPresigner } from '../src/presigner/localPresigner.js'
import { createApiLogger } from '../src/logging.js'
import { createRateLimiter } from '../src/rateLimit.js'
import type { ApiDependencies } from '../src/context.js'

export type TestRuntime = {
  baseUrl: string
  server: Server
  deps: ApiDependencies
  store: MemoryStore
  logLines: string[]
  close: () => Promise<void>
}

export async function getFreePort(): Promise<number> {
  const netServer = createNetServer()
  netServer.listen(0, '127.0.0.1')
  await once(netServer, 'listening')
  const address = netServer.address() as AddressInfo
  const port = address.port
  await new Promise<void>((resolve) => netServer.close(() => resolve()))
  return port
}

export async function startTestServer(
  overrides: Partial<ApiConfig> = {},
  env: Record<string, string | undefined> = {},
): Promise<TestRuntime> {
  const port = await getFreePort()
  const config: ApiConfig = {
    ...createConfig({
      ...env,
      'PORT': String(port),
      'CAP_PUBLIC_BASE_URL': `http://127.0.0.1:${port}`,
    }),
    ...overrides,
  }

  const store = createMemoryStore()
  const logLines: string[] = []
  const logger = createApiLogger({ sink: (line) => logLines.push(line) })
  const deps: ApiDependencies = {
    config,
    store,
    presigner: createLocalPresigner(config),
    logger,
    rateLimiter: createRateLimiter(config.rateLimit),
  }

  const server = createApiServer(deps)
  server.listen(config.port, '127.0.0.1')
  await once(server, 'listening')

  return {
    baseUrl: `http://127.0.0.1:${config.port}`,
    server,
    deps,
    store,
    logLines,
    close: async () => {
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}