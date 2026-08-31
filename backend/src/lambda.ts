import { handleApiRequest } from './api.js'
import type { ApiDependencies } from './context.js'
import type { ApiRequest } from './http.js'

/**
 * API Gateway proxy-event shape for the Lambda integration. Only the fields
 * this API reads are modeled; unknown event properties are ignored.
 */
export type LambdaEvent = {
  httpMethod?: string
  path?: string
  headers?: Record<string, string>
  queryStringParameters?: Record<string, string>
  pathParameters?: Record<string, string> | null
  body?: string | null
  isBase64Encoded?: boolean
  requestContext?: { identity?: { sourceIp?: string } }
}

export type LambdaResult = {
  statusCode: number
  headers: Record<string, string>
  body: string
}

function lowerHeaders(input: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    headers[key.toLowerCase()] = value
  }
  return headers
}

/**
 * Adapts the shared request dispatcher to an API Gateway Lambda handler. Each
 * route in `api.ts` is reached through this single entrypoint, so the local
 * server and the deployed function share one implementation.
 */
export function createLambdaHandler(deps: ApiDependencies) {
  return async (event: LambdaEvent): Promise<LambdaResult> => {
    const headers = lowerHeaders(event.headers ?? {})
    const body =
      event.isBase64Encoded && event.body
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : (event.body ?? null)

    const request: ApiRequest = {
      method: event.httpMethod ?? 'GET',
      path: event.path ?? '/',
      params: event.pathParameters ?? {},
      query: new URLSearchParams({ ...event.queryStringParameters }),
      headers,
      body,
      clientIp: event.requestContext?.identity?.sourceIp ?? null,
      secure: headers['x-forwarded-proto']?.toLowerCase() === 'https',
    }

    const response = await handleApiRequest(request, deps)
    return {
      statusCode: response.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        ...response.headers,
      },
      body: JSON.stringify(response.body),
    }
  }
}