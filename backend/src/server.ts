import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { handleApiRequest } from './api.js'
import type { ApiDependencies } from './context.js'
import { ApiError, toErrorResponse } from './errors.js'
import type { ApiRequest, ApiResponse } from './http.js'

async function readBody(request: IncomingMessage, maxBytes: number): Promise<string> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > maxBytes) {
      throw new ApiError(413, 'payload_too_large', 'The request body is too large.')
    }
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function headerMap(request: IncomingMessage): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue
    headers[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value
  }
  return headers
}

function toApiRequest(
  request: IncomingMessage,
  body: string,
  clientIp: string | null,
): ApiRequest {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const headers = headerMap(request)
  return {
    method: request.method ?? 'GET',
    path: url.pathname,
    params: {},
    query: url.searchParams,
    headers,
    body,
    clientIp,
    secure: Boolean((request.socket as { encrypted?: boolean }).encrypted) || headers['x-forwarded-proto'] === 'https',
  }
}

function writeJson(response: ServerResponse, apiResponse: ApiResponse): void {
  const payload = JSON.stringify(apiResponse.body)
  response.writeHead(apiResponse.status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...apiResponse.headers,
  })
  response.end(payload)
}

/**
 * Creates the local HTTP server exposing the same routes and response shapes
 * the Lambda adapter uses, so development and contract testing run against the
 * real backend behavior without AWS infrastructure.
 */
export function createApiServer(deps: ApiDependencies): Server {
  return createServer((request, response) => {
    const clientIp = request.socket.remoteAddress ?? null
    ;(async () => {
      let apiResponse: ApiResponse
      try {
        const body =
          request.method === 'GET' || request.method === 'HEAD'
            ? ''
            : await readBody(request, deps.config.maxBodyBytes)
        apiResponse = await handleApiRequest(toApiRequest(request, body, clientIp), deps)
      } catch (error) {
        deps.logger.log('error', 'unhandled-error', { error: 'internal' })
        apiResponse = toErrorResponse(error)
      }
      writeJson(response, apiResponse)
    })().catch(() => {
      // The response can only fail to write after the client disconnected.
    })
  })
}