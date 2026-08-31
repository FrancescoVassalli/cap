/**
 * A tiny in-memory sliding-window rate limiter for public API entry points.
 * In a deployed Lambda the counter would live in a shared store (DynamoDB /
 * ElastiCache); the interface keeps that swap isolated.
 */
export type RateLimiter = {
  isLimited: (key: string) => boolean
}

export function createRateLimiter(options: {
  windowMs: number
  maxRequests: number
}): RateLimiter {
  const hits = new Map<string, number[]>()

  return {
    isLimited(key) {
      const now = Date.now()
      const windowStart = now - options.windowMs
      const recent = (hits.get(key) ?? []).filter((timestamp) => timestamp >= windowStart)
      if (recent.length >= options.maxRequests) {
        hits.set(key, recent)
        return true
      }
      recent.push(now)
      hits.set(key, recent)
      return false
    },
  }
}