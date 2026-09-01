/**
 * Native document selection using expo-document-picker.
 *
 * Wraps the platform picker behind a small adapter so the step component stays
 * transport-neutral. No raw file bytes or names are logged; only validated
 * metadata is passed through the shared `IntakeDocument` shape.
 */

import * as DocumentPicker from 'expo-document-picker'

export type PickedDocument = {
  id: string
  name: string
  size: number
  type: string
  /** Local uri for potential upload. Never used as a storage/security key. */
  uri?: string
}

export async function pickDocuments(): Promise<PickedDocument[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
    copyToCacheDirectory: true,
    multiple: true,
  })

  if (result.canceled) {
    return []
  }

  return result.assets.map((asset, index) => ({
    id: `${asset.uri ?? index}-${Date.now()}-${index}`,
    name: asset.name ?? 'document',
    size: asset.size ?? 0,
    type: asset.mimeType ?? 'application/octet-stream',
    uri: asset.uri,
  }))
}
