/**
 * Mobile ZIP lookup service.
 *
 * Mirrors the web app's `StaticZipService` pattern: a dataset-backed adapter
 * behind the shared `ZipService` interface. The UI must never import the raw
 * dataset directly. Returns the postal locality for known CO codes and `null`
 * for unknown/blank/malformed codes so the intake can continue without blocking.
 */

import type { ZipLocation, ZipService } from '@cap/shared'

/** Small embedded Colorado ZIP sample. Kept trim for the mobile bundle. */
const CO_ZIP_SAMPLE: Record<string, ZipLocation> = {
  '80014': { zipCode: '80014', city: 'Aurora', state: 'CO', county: 'Arapahoe' },
  '80110': { zipCode: '80110', city: 'Englewood', state: 'CO', county: 'Arapahoe' },
  '80120': { zipCode: '80120', city: 'Littleton', state: 'CO', county: 'Arapahoe' },
  '80202': { zipCode: '80202', city: 'Denver', state: 'CO', county: 'Denver' },
  '80203': { zipCode: '80203', city: 'Denver', state: 'CO', county: 'Denver' },
  '80205': { zipCode: '80205', city: 'Denver', state: 'CO', county: 'Denver' },
  '80211': { zipCode: '80211', city: 'Denver', state: 'CO', county: 'Denver' },
  '80219': { zipCode: '80219', city: 'Denver', state: 'CO', county: 'Denver' },
  '80220': { zipCode: '80220', city: 'Denver', state: 'CO', county: 'Denver' },
  '80501': { zipCode: '80501', city: 'Longmont', state: 'CO', county: 'Boulder' },
  '80521': { zipCode: '80521', city: 'Fort Collins', state: 'CO', county: 'Larimer' },
  '80903': { zipCode: '80903', city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '80918': { zipCode: '80918', city: 'Colorado Springs', state: 'CO', county: 'El Paso' },
  '81007': { zipCode: '81007', city: 'Pueblo', state: 'CO', county: 'Pueblo' },
  '81601': { zipCode: '81601', city: 'Glenwood Springs', state: 'CO', county: 'Garfield' },
}

const ZIP_CODE_RE = /^\d{5}$/

export class StaticZipService implements ZipService {
  private readonly index: Record<string, ZipLocation>

  constructor(records: Record<string, ZipLocation> = CO_ZIP_SAMPLE) {
    this.index = records
  }

  lookup(zip: string): ZipLocation | null {
    const clean = zip.trim()
    if (!ZIP_CODE_RE.test(clean)) return null
    return this.index[clean] ?? null
  }
}

export const zipService: ZipService = new StaticZipService()
