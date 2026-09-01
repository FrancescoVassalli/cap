/**
 * Native document selection and photo capture.
 *
 * Wraps the platform picker/camera behind a small adapter so the step component
 * stays transport-neutral. The asset → picked-document mapping is a pure
 * function (`toPickedDocument`) that is unit-testable in node; only validated
 * metadata is passed through the shared `IntakeDocument` shape, and no raw
 * file bytes or names are logged.
 */

import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { toPickedDocument, type PickedDocument } from './pickedDocument'

export type { PickedDocument } from './pickedDocument'

export type PhotoCaptureResult =
  | { status: 'captured'; document: PickedDocument }
  | { status: 'canceled' }
  | { status: 'permission-denied' }

export async function pickDocuments(): Promise<PickedDocument[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
    copyToCacheDirectory: true,
    multiple: true,
  })

  if (result.canceled) {
    return []
  }

  return result.assets.map((asset, index) =>
    toPickedDocument(asset, 'document', 'application/octet-stream', Date.now(), index),
  )
}

/**
 * Captures a photo of a document with the native camera. Requires the user to
 * grant camera permission first; a graceful `permission-denied` status lets the
 * UI explain without breaking the flow. Only the local image uri is returned
 * (never base64 bytes).
 */
export async function takePhoto(): Promise<PhotoCaptureResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync()
  if (!permission.granted) {
    return { status: 'permission-denied' }
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  })

  if (result.canceled) {
    return { status: 'canceled' }
  }
  const asset = result.assets[0]
  if (!asset) {
    return { status: 'canceled' }
  }
  return {
    status: 'captured',
    document: toPickedDocument(asset, 'photo.jpg', 'image/jpeg', Date.now(), 0),
  }
}