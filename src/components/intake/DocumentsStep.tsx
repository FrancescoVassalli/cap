import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/forms/Button'
import { FileInput } from '@/components/forms/FileInput'
import { FormField } from '@/components/forms/FormField'
import type { AllContent } from '@/content'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import type { IntakeDocument } from '@/types/index'
import { validateDocumentFiles } from '@/validation/documentValidation'

interface DocumentsStepProps {
  content: AllContent
  intakeId: string
  documents: IntakeDocument[]
  onAddDocuments: (documents: IntakeDocument[]) => void
  onRemoveDocument: (documentId: string) => void
  onClearDocuments: () => void
  onUploadingChange?: (uploading: boolean) => void
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
  onUploadingChange,
}: DocumentsStepProps) {
  const [documentErrors, setDocumentErrors] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const uploadsInFlightRef = useRef(0)
  const { upload } = useDocumentUpload()

  useEffect(() => {
    onUploadingChange?.(isUploading)
  }, [isUploading, onUploadingChange])

  useEffect(() => {
    return () => onUploadingChange?.(false)
  }, [onUploadingChange])

  const startUploading = () => {
    uploadsInFlightRef.current += 1
    if (uploadsInFlightRef.current === 1) {
      setIsUploading(true)
    }
  }

  const finishUploading = () => {
    uploadsInFlightRef.current = Math.max(0, uploadsInFlightRef.current - 1)
    if (uploadsInFlightRef.current === 0) {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''

    const result = validateDocumentFiles(selected, documents, content)
    setDocumentErrors(result.errors)

    if (result.accepted.length === 0) return

    startUploading()
    try {
      const uploaded: IntakeDocument[] = []
      for (const file of result.accepted) {
        const attempt = await upload(file, intakeId)
        if (attempt.error) {
          setDocumentErrors((current) => [...current, content.intakeForm.errors.generic])
          continue
        }
        uploaded.push(attempt.document)
      }

      if (uploaded.length > 0) {
        onAddDocuments(uploaded)
      }
    } finally {
      finishUploading()
    }
  }

  const handleClearDocuments = () => {
    setDocumentErrors([])
    onClearDocuments()
  }

  const documentsContent = content.intakeForm.documents

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-900">{documentsContent.heading}</h2>
      <p className="text-base text-slate-700">{documentsContent.description}</p>

      <div className="rounded-xl border border-cap-secondary/40 bg-cap-primary-50/50 p-4">
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
        <ul className="space-y-2 rounded-xl border border-cap-secondary/40 bg-cap-primary-50/50 p-3">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between gap-3 rounded border border-cap-secondary/40 bg-white px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-900">{document.name}</p>
                <p className="text-xs text-slate-600">{formatFileSize(document.size)}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveDocument(document.id)}
                aria-label={`${documentsContent.remove} ${document.name}`}
              >
                {documentsContent.remove}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1">
        <p className="text-sm text-slate-600">{documentsContent.skipLabel}</p>
        {documents.length > 0 && (
          <button
            type="button"
            className="text-sm font-medium text-cap-primary underline underline-offset-2"
            onClick={handleClearDocuments}
          >
            {documentsContent.skipButtonLabel}
          </button>
        )}
      </div>
    </div>
  )
}