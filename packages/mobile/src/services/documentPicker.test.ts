import { describe, expect, it } from 'vitest'
import { toPickedDocument, type NativeAssetLike } from './pickedDocument'

describe('toPickedDocument', () => {
  it('maps a fully-populated asset to the opaque picked-document shape', () => {
    const document = toPickedDocument(
      {
        uri: 'file:///cache/photo-1.jpg',
        fileName: 'denial-letter.jpg',
        fileSize: 2048,
        mimeType: 'image/jpeg',
      },
      undefined,
      undefined,
      12345,
      0,
    )
    expect(document).toEqual({
      id: 'file:///cache/photo-1.jpg-12345-0',
      name: 'denial-letter.jpg',
      size: 2048,
      type: 'image/jpeg',
      uri: 'file:///cache/photo-1.jpg',
    })
  })

  it('falls back to a safe filename for camera captures that lack one', () => {
    const document = toPickedDocument(
      { uri: 'file:///cache/capture.jpg', fileSize: 1000, mimeType: 'image/jpeg' },
      'photo.jpg',
      'image/jpeg',
      1,
      0,
    )
    expect(document.name).toBe('photo.jpg')
  })

  it('prefers fileName over the legacy name field', () => {
    const document = toPickedDocument({ uri: 'u', name: 'legacy', fileName: 'new-name', size: 5 })
    expect(document.name).toBe('new-name')
  })

  it('defaults an unknown size to zero', () => {
    const document = toPickedDocument({ uri: 'u', name: 'x' })
    expect(document.size).toBe(0)
  })

  it('defaults an unknown mime type to octet-stream', () => {
    const document = toPickedDocument({ uri: 'u', name: 'x', size: 5 })
    expect(document.type).toBe('application/octet-stream')
  })

  it('disambiguates ids within the same pick batch using the index', () => {
    const now = 999
    const first = toPickedDocument({ uri: 'a', name: 'a' }, undefined, undefined, now, 0)
    const second = toPickedDocument({ uri: 'b', name: 'b' }, undefined, undefined, now, 1)
    expect(first.id).not.toBe(second.id)
  })

  it('keeps a missing uri opaque and still maps safely', () => {
    const document = toPickedDocument({} as NativeAssetLike, 'photo.jpg', 'image/jpeg', 5, 0)
    expect(document.uri).toBeUndefined()
    expect(document.id.startsWith('capture-')).toBe(true)
    expect(document.name).toBe('photo.jpg')
    expect(document.type).toBe('image/jpeg')
  })
})