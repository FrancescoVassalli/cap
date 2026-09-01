import type { ApiRequest, ApiResponse } from './http.js'
import { json } from './http.js'
import type { ApiDependencies } from './context.js'
import { matchRoutePath, type Route } from './router.js'
import { applyCors, preflightResponse } from './cors.js'
import { createIntake } from './handlers/createIntake.js'
import { createUploadUrl } from './handlers/createUploadUrl.js'
import { receiveUpload } from './handlers/receiveUpload.js'
import { health } from './handlers/health.js'

const ROUTES: Route[] = [
  { method: 'GET', pattern: '/health', handler: health },
  { method: 'POST', pattern: '/intakes', handler: createIntake, rateLimited: true },
  { method: 'POST', pattern: '/intakes/:id/upload-url', handler: createUploadUrl, rateLimited: true },
  { method: 'PUT', pattern: '/uploads/:id', handler: receiveUpload },
]

/**
 * Transport-neutral route dispatcher. Both the local Node server and the
 * Lambda adapter build an {@link ApiRequest} and call this function, so each
 * route maps cleanly to a Lambda handler without duplicating logic.
 */
export async function handleApiRequest(
  request: ApiRequest,
  deps: ApiDependencies,
): Promise<ApiResponse> {
  const preflight = preflightResponse(request, deps.config.allowedOrigins)
  if (preflight) return preflight

  if (deps.config.requireHttps && !request.secure && request.path !== '/health') {
    return json(400, { error: { code: 'https_required', message: 'HTTPS is required.' } })
  }

  for (const route of ROUTES) {
    if (route.method !== request.method) continue
    const params = matchRoutePath(route.pattern, request.path)
    if (params === null) continue

    if (route.rateLimited) {
      const key = `${request.method} ${request.path} ${request.clientIp ?? 'unknown'}`
      if (deps.rateLimiter.isLimited(key)) {
        return applyCors(
          request,
          json(429, {
            error: { code: 'rate_limited', message: 'Too many requests. Please try again later.' },
          }),
          deps.config.allowedOrigins,
        )
      }
    }

    deps.logger.log('debug', 'route-matched', { method: request.method, route: route.pattern })
    const scopedRequest: ApiRequest = { ...request, params }
    const response = await route.handler(scopedRequest, deps)
    return applyCors(request, response, deps.config.allowedOrigins)
  }

  return applyCors(
    request,
    json(404, { error: { code: 'not_found', message: 'Not found.' } }),
    deps.config.allowedOrigins,
  )
}