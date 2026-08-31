import { json, type ApiResponse } from './http.js'

/**
 * Thrown for failures the API can describe with a safe, client-facing code.
 * Messages must never include raw payload values, PHI, or stack internals.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * Maps any unexpected failure to a generic structured error. Internals are
 * never leaked to the client; the caller should log the error category.
 */
export function toErrorResponse(error: unknown): ApiResponse {
  if (error instanceof ApiError) {
    return json(error.status, { error: { code: error.code, message: error.message } })
  }
  return json(500, {
    error: { code: 'internal_error', message: 'The service could not complete the request.' },
  })
}