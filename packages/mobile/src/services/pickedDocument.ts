/**
 * Native asset mapping for the document picker / camera capture adapters.
 *
 * Kept free of any native module imports so the mapping logic is pure and
 * unit-testable in a node environment. The real picker/camera adapters import
 * this module and wrap it with the platform calls.
 */

export type PickedDocument = {
  id: string
  name: string
  size: number
  type: string
  /** Local uri for potential upload. Never used as a storage/security key. */
  uri?: string
}

/**
 * Minimal platform-agnostic asset shape shared by the picker and camera so the
 * mapping logic stays transport-neutral and testable.
 */
export type NativeAssetLike = {
  uri?: string
  name?: string
  fileName?: string | null
  size?: number
  fileSize?: number
  mimeType?: string | null
}

/**
 * Maps a native asset to the opaque `PickedDocument` the step UI understands.
 * Camera captures commonly lack a filename and file size, so safe fallbacks are
 * applied. `now`/`index` keep the opaque id unique across picks within a batch.
 */
export function toPickedDocument(
  asset: NativeAssetLike,
  fallbackName = 'document',
  fallbackType = 'application/octet-stream',
  now: number = Date.now(),
  index = 0,
): PickedDocument {
  return {
    id: `${asset.uri ?? 'capture'}-${now}-${index}`,
    name: asset.fileName ?? asset.name ?? fallbackName,
    size: asset.fileSize ?? asset.size ?? 0,
    type: asset.mimeType ?? fallbackType,
    uri: asset.uri,
  }
}