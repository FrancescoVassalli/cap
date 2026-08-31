import type { ApiRequest, ApiResponse } from './http.js'
import type { ApiDependencies } from './context.js'

export type RouteHandler = (request: ApiRequest, deps: ApiDependencies) => Promise<ApiResponse>

export type Route = {
  method: string
  pattern: string
  handler: RouteHandler
  rateLimited?: boolean
}

/**
 * Matches a path pattern with `:param` segments against a concrete path and
 * returns the captured parameters, or null when the pattern does not match.
 */
export function matchRoutePath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]
    if (patternPart.startsWith(':')) {
      try {
        params[patternPart.slice(1)] = decodeURIComponent(pathPart)
      } catch {
        return null
      }
    } else if (patternPart !== pathPart) {
      return null
    }
  }
  return params
}