/**
 * Web view of the shared backend wire-format mapper.
 *
 * The EveryAction field mapping, metadata builder, and URL encoder live in
 * `@cap/shared` so the web and mobile apps transmit identical bodies. This
 * module re-exports them under the same names the web app and its tests use,
 * retaining the single source of truth.
 */

export {
  DEFAULT_EVERY_ACTION_CONFIG,
  buildEveryActionMeta,
  buildUrlEncoded,
  detectBrowserName,
  detectDeviceType,
  toEveryActionBody,
} from '@cap/shared'
export type { EveryActionConfig, EveryActionMeta } from '@cap/shared'