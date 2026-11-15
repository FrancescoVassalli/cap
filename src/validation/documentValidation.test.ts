import { describe, expect, it } from 'vitest'
import { getContent } from '@/content'
import { validateDocumentFiles } from './documentValidation'

function makeFile(name: string, type = 'application/pdf') {
  return new File(['test'], name, { type })
}

describe('validateDocumentFiles', () => {
  const content = getContent('en')

  it('accepts only the first of two files with the same name and size', () => {
    const first = makeFile('invoice.pdf')
    const second = makeFile('invoice.pdf')

    const result = validateDocumentFiles([first, second], [], content)

    expect(result.accepted).toEqual([first])
    expect(result.accepted[0]).toBe(first)
    expect(result.errors).toEqual([content.intakeForm.errors.duplicateFile])
  })

  it('rejects a file already attached to the intake', () => {
    const file = makeFile('invoice.pdf')
    const result = validateDocumentFiles(
      [file],
      [{ id: 'doc-1', name: file.name, size: file.size, type: file.type }],
      content,
    )

    expect(result.accepted).toEqual([])
    expect(result.errors).toEqual([content.intakeForm.errors.duplicateFile])
  })
})
