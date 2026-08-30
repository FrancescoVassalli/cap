import { useCallback } from 'react'
import { services, type Services } from '@/services'
import type { ZipLocation } from '@/types/index'

/**
 * Hook that encapsulates ZIP lookup behavior behind the zip service boundary.
 *
 * The lookup is synchronous over the static dataset, but the hook is shaped to
 * isolate loading/notice behavior so a remote lookup can replace it later
 * without changing the components that consume it.
 */
export type ZipLookupResult = {
  location: ZipLocation | null
  /** True when the input is a complete 5-digit code that was not found. */
  isUnknown: boolean
}

export function useZipLookup(deps: Services = services) {
  const lookup = useCallback(
    (zip: string): ZipLookupResult => {
      const location = deps.zip.lookup(zip)
      const isUnknown = /^\d{5}$/.test(zip) && location === null
      return { location, isUnknown }
    },
    [deps.zip],
  )

  return { lookup }
}
