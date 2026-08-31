/**
 * The normalized request/response shapes shared by the Node HTTP server and
 * the Lambda adapter. Handlers only see this transport-neutral request; the
 * Node server and API Gateway each translate their own event shape into it.
 */
export type ApiRequest = {
  method: string
  path: string
  params: Record<string, string>
  query: URLSearchParams
  headers: Record<string, string>
  body: string | null
  clientIp: string | null
  secure: boolean
}

export type ApiResponse = {
  status: number
  body: unknown
  headers?: Record<string, string>
}

export function json(
  status: number,
  body: unknown,
  headers?: Record<string, string>,
): ApiResponse {
  return { status, body, headers }
}