import type { ZipLocation } from '@/types/index'

export type ZipService = {
  lookup: (zip: string) => ZipLocation | null
}

export class MockZipService implements ZipService {
  private readonly locations: Record<string, ZipLocation> = {
    '80203': { zipCode: '80203', city: 'Denver', state: 'CO', county: 'Denver' },
    '80014': { zipCode: '80014', city: 'Aurora', state: 'CO', county: 'Adams' },
  }

  lookup(zip: string): ZipLocation | null {
    const clean = zip.trim()
    return this.locations[clean] ?? null
  }
}
