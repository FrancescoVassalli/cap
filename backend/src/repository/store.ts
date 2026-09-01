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

/**
 * A durable audit-log entry for a received intake submission. The full form
 * input is captured here (in the durable store, never in the PHI-free stdout
 * logger) so a submission can be inspected/recorded without leaking raw
 * consumer data into operation logs.
 */
export type IntakeLogEntry = {
  id: string
  intakeId: string
  sourceChannel: 'web' | string
  receivedAt: string
  /** The complete submitted form input, verbatim (consumer fields + metadata). */
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
  appendIntakeLog: (entry: IntakeLogEntry) => Promise<IntakeLogEntry>
  getIntakeLog: (intakeId: string) => Promise<IntakeLogEntry[]>
  listDocuments: (intakeId: string) => Promise<DocumentRecord[]>
  addDocument: (record: DocumentRecord) => Promise<DocumentRecord>
  getDocument: (intakeId: string, documentId: string) => Promise<DocumentRecord | null>
  markDocumentUploaded: (
    intakeId: string,
    documentId: string,
  ) => Promise<DocumentRecord | null>
}