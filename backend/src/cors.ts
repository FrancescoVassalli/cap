import type { ApiRequest, ApiResponse } from './http.js'

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'HEAD', 'OPTIONS']
const ALLOWED_HEADERS = [
  'Content-Type',
  'Idempotency-Key',
  'If-None-Match',
]

/**
 * Shared browser CORS handling. The intake API is reached cross-origin from a
 * static frontend host (the Vite dev server locally, S3 + CloudFront in
 * production), so responses need permissive-but-scoped CORS headers.
 *
 * CORS is a browser-enforced transport concern, so it lives here in the
 * transport layer (used by both the Node server and the Lambda adapter) rather
 * than in route handlers, which stay transport-neutral.
 */
export function isPreflight(request: ApiRequest): boolean {
  return (
    request.method === 'OPTIONS' &&
    request.headers['access-control-request-method'] !== undefined
  )
}

/**
 * Computes the CORS headers for a given request origin. Returns an empty object
 * when the origin is not allowed so the response carries no allow header and the
 * browser blocks it. A `*` entry reflects any origin as the literal `*`.
 */
export function corsHeaders(request: ApiRequest, allowedOrigins: string[]): Record<string, string> {
  const origin = request.headers['origin']
  const allowAll = allowedOrigins.includes('*')

  if (!origin) return {}
  if (!allowAll && !allowedOrigins.includes(origin)) return {}

  return {
    'access-control-allow-origin': allowAll ? '*' : origin,
    'vary': 'origin',
  }
}

/**
 * Produces a complete CORS response for an OPTIONS preflight, or null to fall
 * through to normal routing.
 */
export function preflightResponse(request: ApiRequest, allowedOrigins: string[]): ApiResponse | null {
  if (!isPreflight(request)) return null
  const cors = corsHeaders(request, allowedOrigins)
  if (Object.keys(cors).length === 0) {
    return { status: 403, body: { error: { code: 'origin_not_allowed', message: 'Origin not allowed.' } } }
  }

  return {
    status: 204,
    body: '',
    headers: {
      ...cors,
      'access-control-allow-methods': ALLOWED_METHODS.join(', '),
      'access-control-allow-headers': ALLOWED_HEADERS.join(', '),
      'access-control-max-age': '600',
    },
  }
}

/**
 * Appends CORS headers to an existing API response, dropping them when the
 * origin is not permitted.
 */
export function applyCors(request: ApiRequest, response: ApiResponse, allowedOrigins: string[]): ApiResponse {
  const cors = corsHeaders(request, allowedOrigins)
  if (Object.keys(cors).length === 0) return response
  return { ...response, headers: { ...response.headers, ...cors } }
}
