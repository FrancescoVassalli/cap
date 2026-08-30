import { useState, type ChangeEvent } from 'react'
import { Button } from '@/components/forms/Button'
import { FileInput } from '@/components/forms/FileInput'
import { FormField } from '@/components/forms/FormField'
import type { AllContent } from '@/content'
import { LocalDocumentUploadService } from '@/services/documentUploadService'
import type { IntakeDocument } from '@/types/index'
import { validateDocumentFiles } from '@/validation/documentValidation'

const uploadService = new LocalDocumentUploadService()

interface DocumentsStepProps {
  content: AllContent
  intakeId: string
  documents: IntakeDocument[]
  onAddDocuments: (documents: IntakeDocument[]) => void
  onRemoveDocument: (documentId: string) => void
  onClearDocuments: () => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsStep({
  content,
  intakeId,
  documents,
  onAddDocuments,
  onRemoveDocument,
  onClearDocuments,
}: DocumentsStepProps) {
  const [documentErrors, setDocumentErrors] = useState<string[]>([])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''

    const result = validateDocumentFiles(selected, documents, content)
    setDocumentErrors(result.errors)

    if (result.accepted.length === 0) return

    const uploaded: IntakeDocument[] = []
    for (const file of result.accepted) {
      try {
        const uploadedDocument = await uploadService.upload(file, intakeId)
        uploaded.push({
          id: uploadedDocument.id,
          name: uploadedDocument.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
        })
      } catch {
        setDocumentErrors((current) => [...current, content.intakeForm.errors.generic])
      }
    }

    if (uploaded.length > 0) {
      onAddDocuments(uploaded)
    }
  }

  const documentsContent = content.intakeForm.documents

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-900">{documentsContent.heading}</h2>
      <p className="text-base text-slate-700">{documentsContent.description}</p>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">{documentsContent.examples.heading}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {documentsContent.examples.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <FormField
        label={documentsContent.chooseFiles}
        htmlFor="documents"
        error={documentErrors[0]}
        hint={`${documentsContent.allowedTypesDescription}. ${documentsContent.maxFileSizeWarning} ${documentsContent.maxTotalSizeWarning}`}
      >
        <FileInput
          id="documents"
          name="documents"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          multiple
          onChange={handleFileChange}
          isInvalid={documentErrors.length > 0}
          aria-invalid={documentErrors.length > 0}
        />
      </FormField>

      {documentErrors.length > 1 && (
        <div role="alert" className="rounded-xl border border-status-error bg-red-50 p-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-status-error">
            {documentErrors.slice(1).map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {documents.length > 0 && (
        <ul className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-900">{document.name}</p>
                <p className="text-xs text-slate-600">{formatFileSize(document.size)}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => onRemoveDocument(document.id)}>
                {documentsContent.remove}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1">
        <p className="text-sm text-slate-600">{documentsContent.skipLabel}</p>
        <button
          type="button"
          className="text-sm font-medium text-cap-primary underline underline-offset-2"
          onClick={onClearDocuments}
        >
          {documentsContent.skipButtonLabel}
        </button>
      </div>
    </div>
  )
}