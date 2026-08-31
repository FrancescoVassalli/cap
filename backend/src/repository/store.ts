/**
 * Durable-store abstraction for intake and document records. The local
 * implementation is an in-memory map; production deployments swap this for
 * DynamoDB (intake records) and S3 metadata without touching the handlers.
 */
export type IntakeRecord = {
  intakeId: string
  referenceId: string
  sourceChannel: string
  formSessionId: string
  clientSubmissionId: string
  receivedAt: string
  fields: Record<string, string>
}

export type DocumentRecord = {
  intakeId: string
  id: string
  fileName: string
  contentType: string
  size: number
  objectKey: string
  status: 'pending' | 'uploaded'
  createdAt: string
}

export type Store = {
  createIntake: (record: IntakeRecord) => Promise<IntakeRecord>
  getIntakeByIntakeId: (intakeId: string) => Promise<IntakeRecord | null>
  listDocuments: (intakeId: string) => Promise<DocumentRecord[]>
  addDocument: (record: DocumentRecord) => Promise<DocumentRecord>
  getDocument: (intakeId: string, documentId: string) => Promise<DocumentRecord | null>
  markDocumentUploaded: (
    intakeId: string,
    documentId: string,
  ) => Promise<DocumentRecord | null>
}