import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getContent } from '@/content'
import type { UploadedIntakeDocument } from '@/hooks/useDocumentUpload'
import { DocumentsStep } from './DocumentsStep'

const { uploadMock } = vi.hoisted(() => ({ uploadMock: vi.fn() }))

vi.mock('@/hooks/useDocumentUpload', () => ({
  useDocumentUpload: () => ({ upload: uploadMock }),
}))

function makeFile(name: string) {
  return new File(['test'], name, { type: 'application/pdf' })
}

function deferredUpload() {
  let resolve: (value: UploadedIntakeDocument) => void = () => undefined
  const promise = new Promise<UploadedIntakeDocument>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function renderDocumentsStep(onUploadingChange = vi.fn()) {
  const onAddDocuments = vi.fn()
  render(
    <DocumentsStep
      content={getContent('en')}
      intakeId="intake-1"
      documents={[]}
      onAddDocuments={onAddDocuments}
      onRemoveDocument={vi.fn()}
      onClearDocuments={vi.fn()}
      onUploadingChange={onUploadingChange}
    />,
  )
  return { onAddDocuments, onUploadingChange }
}

describe('DocumentsStep', () => {
  it('stays in the uploading state until every overlapping upload finishes', async () => {
    const first = deferredUpload()
    const second = deferredUpload()
    uploadMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { onAddDocuments, onUploadingChange } = renderDocumentsStep()
    const input = screen.getByLabelText(/choose files/i)

    fireEvent.change(input, { target: { files: [makeFile('one.pdf')] } })
    fireEvent.change(input, { target: { files: [makeFile('two.pdf')] } })

    await waitFor(() => expect(onUploadingChange).toHaveBeenLastCalledWith(true))

    await act(async () => {
      first.resolve({
        document: { id: 'doc-1', name: 'one.pdf', size: 4, type: 'application/pdf' },
        error: false,
      })
      await first.promise
    })

    expect(onUploadingChange).toHaveBeenLastCalledWith(true)

    await act(async () => {
      second.resolve({
        document: { id: 'doc-2', name: 'two.pdf', size: 4, type: 'application/pdf' },
        error: false,
      })
      await second.promise
    })

    await waitFor(() => expect(onUploadingChange).toHaveBeenLastCalledWith(false))
    expect(onAddDocuments).toHaveBeenCalledTimes(2)
  })

  it('clears document errors and attached documents when the clear action is used', async () => {
    const onClearDocuments = vi.fn()
    render(
      <DocumentsStep
        content={getContent('en')}
        intakeId="intake-1"
        documents={[{ id: 'doc-1', name: 'one.pdf', size: 4, type: 'application/pdf' }]}
        onAddDocuments={vi.fn()}
        onRemoveDocument={vi.fn()}
        onClearDocuments={onClearDocuments}
        onUploadingChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /clear selected files/i }))

    expect(onClearDocuments).toHaveBeenCalledOnce()
  })
})
