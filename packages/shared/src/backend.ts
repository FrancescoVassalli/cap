/**
 * Shared backend submission wire format.
 *
 * The CAP backend accepts the flat, URL-encoded EveryAction contact form
 * contract (field names like `FirstName`, `EmailAddress`, and numeric language
 * ids). This module owns that mapping once so the web and mobile apps transmit
 * an identical body. Transport is deliberately kept out: callers build the
 * encoded string here and hand it to their platform's fetch.
 *
 * Security: documents are never included as bytes; optional fields are omitted
 * rather than sent blank; and request metadata is non-sensitive.
 */

import type { SubmissionPayload } from './types'

/**
 * Configuration seam for backend wire values that are swapped without code
 * changes. The language ids and question ids come from the EveryAction form
 * config; keeping them here keeps field-name/id concerns out of the UI and the
 * generic API adapter.
 */
export type EveryActionConfig = {
  /** Numeric EveryAction `PreferredLanguages` id for each form language. */
  languageIds: Record<'en' | 'es', string>
  /** EveryAction `type` submitted with the form. */
  type: string
  /** `XFromApp` value sent to the endpoint. */
  xFromApp: string
  /** Fallback `ActionTagBaseUrl` when a real base cannot be derived. */
  actionTagBaseUrl: string
  /** Fallback `FormVersion` value from the published form config. */
  formVersion: string
}

/**
 * Default ids derived from the EveryAction form config. `en` -> 62 and
 * `es` -> 15 per the approved mapping. These are intentionally swappable via
 * the config argument so a backend decision can correct them without code
 * changes.
 */
export const DEFAULT_EVERY_ACTION_CONFIG: EveryActionConfig = {
  languageIds: { en: '62', es: '15' },
  type: 'SignupForm',
  xFromApp: 'ActionTag',
  actionTagBaseUrl: 'https://static.everyaction.com/ea-actiontag/',
  formVersion: '12/10/2024 6:54:59 PM|',
}

/**
 * Request-scoped metadata the backend endpoint expects alongside the collected
 * contact data. The session / client submission ids are derived client-side and
 * are not sensitive.
 */
export type EveryActionMeta = {
  formSessionId: string
  clientSubmissionId: string
  formVersion?: string
  browserName?: string
  deviceType?: string
}

/** Best-effort detection of the browser name from a user agent string. */
export function detectBrowserName(userAgent?: string): string {
  const ua = userAgent ?? ''
  if (/edg/i.test(ua)) return 'edge'
  if (/firefox/i.test(ua)) return 'firefox'
  if (/chrome/i.test(ua)) return 'chrome'
  if (/safari/i.test(ua)) return 'safari'
  return 'unknown'
}

/** Best-effort detection of the device class from a user agent string. */
export function detectDeviceType(userAgent?: string): string {
  const ua = userAgent ?? ''
  if (/ipad|tablet/i.test(ua)) return 'tablet'
  if (/mobi|iphone|android/i.test(ua)) return 'mobile'
  return 'desktop'
}

function newId(): string {
  const cryptoObj =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto
      : undefined
  if (cryptoObj) return cryptoObj.randomUUID()
  // Fallback for environments that lack randomUUID (e.g. jsdom).
  return '00000000-0000-4000-8000-000000000000'
}

/**
 * Assembles the request metadata for a submission, deriving the session and
 * client submission ids client-side. Browser/device are pulled from the real
 * user agent when available and fall back to safe defaults otherwise.
 */
export function buildEveryActionMeta(
  partial: Partial<EveryActionMeta> = {},
  userAgent?: string,
): EveryActionMeta {
  return {
    formSessionId: partial.formSessionId ?? newId(),
    clientSubmissionId: partial.clientSubmissionId ?? newId(),
    formVersion: partial.formVersion,
    browserName: partial.browserName ?? detectBrowserName(userAgent),
    deviceType: partial.deviceType ?? detectDeviceType(userAgent),
  }
}

/**
 * Pure transformation of the application-level payload (plus request metadata)
 * into the flat, EveryAction field map. Optional data (skipped ZIP, optional
 * phone) is omitted from the output, and documents remain out of the body
 * (they are uploaded separately; the endpoint receives no file bytes here).
 */
export function toEveryActionBody(
  payload: SubmissionPayload,
  meta: EveryActionMeta,
  config: EveryActionConfig = DEFAULT_EVERY_ACTION_CONFIG,
): Record<string, string> {
  const body: Record<string, string> = {
    type: config.type,
    FirstName: payload.firstName,
    LastName: payload.lastName,
    PreferredLanguages: config.languageIds[payload.language],
    EmailAddress: payload.email,
    City: payload.city,
    FormSessionId: meta.formSessionId,
    ClientSubmissionId: meta.clientSubmissionId,
    BrowserName: meta.browserName ?? 'unknown',
    DeviceType: meta.deviceType ?? 'desktop',
    XFromApp: config.xFromApp,
    ActionTagBaseUrl: config.actionTagBaseUrl,
  }

  if (meta.formVersion) body.FormVersion = meta.formVersion

  if (payload.streetAddress) body.AddressLine1 = payload.streetAddress
  if (payload.zipCode) body.PostalCode = payload.zipCode

  if (payload.phone) {
    body.HomePhoneCountryCode = 'us'
    body.HomePhoneInternationalDialingPrefix = '1'
    body.HomePhone = payload.phone.replace(/\D/g, '')
  }

  return body
}

/**
 * Encodes a flat field map as a URL-encoded body string suitable for
 * `application/x-www-form-urlencoded; charset=UTF-8`. Uses URLSearchParams so
 * special characters are percent-encoded per RFC 3986.
 */
export function buildUrlEncoded(body: Record<string, string>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(body)) {
    params.set(key, value)
  }
  return params.toString()
}