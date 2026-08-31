export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type ApiLogger = {
  log: (level: LogLevel, category: string, meta?: Record<string, string | number>) => void
}

/**
 * Structured logger used across handlers. Only safe identifiers and error
 * categories should be passed as meta; raw payloads, PHI, and document
 * contents must never be logged.
 */
export function createApiLogger(
  options: { enabled?: boolean; sink?: (line: string) => void } = {},
): ApiLogger {
  const sink = options.sink ?? ((line: string) => console.log(line))
  const enabled = options.enabled ?? true

  return {
    log(level, category, meta = {}) {
      if (!enabled) return
      const fields = Object.fromEntries(
        Object.entries(meta).map(([key, value]) => [key, String(value)]),
      )
      sink(JSON.stringify({ level, category, ...fields, at: new Date().toISOString() }))
    },
  }
}