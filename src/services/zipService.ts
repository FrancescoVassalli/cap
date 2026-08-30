import zipCodesJson from '@/data/zipCodes.json'
import type { ZipLocation } from '@/types/index'

/**
 * The ZIP lookup service contract.
 *
 * The UI must never import the raw dataset directly; it should depend on this
 * interface and receive a concrete implementation via the service boundary in
 * `@/services`.
 */
export type ZipService = {
  lookup: (zip: string) => ZipLocation | null
}

type ZipRecord = {
  zipCode: string
  city: string
  state: string
  county?: string
}

function isZipRecord(value: unknown): value is ZipRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.zipCode === 'string' &&
    typeof record.city === 'string' &&
    typeof record.state === 'string'
  )
}

function buildIndex(records: Record<string, unknown>): Map<string, ZipLocation> {
  const index = new Map<string, ZipLocation>()
  for (const [key, value] of Object.entries(records)) {
    if (isZipRecord(value)) {
      index.set(key, {
        zipCode: value.zipCode,
        city: value.city,
        state: value.state,
        ...(value.county ? { county: value.county } : {}),
      })
    }
  }
  return index
}

/**
 * Data-backed ZIP lookup that reads from the bundled Colorado dataset.
 * Returns null for unknown or malformed ZIPs rather than blocking the intake.
 */
export class StaticZipService implements ZipService {
  private readonly index: Map<string, ZipLocation>

  constructor(records: Record<string, unknown> = zipCodesJson) {
    this.index = buildIndex(records)
  }

  lookup(zip: string): ZipLocation | null {
    const clean = zip.trim()
    if (!/^\d{5}$/.test(clean)) return null
    return this.index.get(clean) ?? null
  }
}

/**
 * Convenience default instance for the static prototype. In tests and wherever
 * a specific configuration is needed, instantiate `StaticZipService` directly.
 */
export const zipService: ZipService = new StaticZipService()
