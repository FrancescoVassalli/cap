import type { DocumentRecord, IntakeLogEntry, IntakeRecord, Store } from './store.js'

export type MemoryStore = Store & {
  snapshot: () => { intakes: IntakeRecord[]; documents: DocumentRecord[]; logs: IntakeLogEntry[] }
}

/**
 * In-memory implementation of the durable-store contract for local
 * development and contract tests. It holds records only for the process
 * lifetime and is intentionally swappable for a production store.
 */
export function createMemoryStore(): MemoryStore {
  const intakes = new Map<string, IntakeRecord>()
  const documents = new Map<string, DocumentRecord>()
  const logs = new Map<string, IntakeLogEntry[]>()

  return {
    async createIntake(record) {
      intakes.set(record.intakeId, record)
      return record
    },
    async getIntakeByIntakeId(intakeId) {
      return intakes.get(intakeId) ?? null
    },
    async appendIntakeLog(entry) {
      const current = logs.get(entry.intakeId) ?? []
      current.push(entry)
      logs.set(entry.intakeId, current)
      return entry
    },
    async getIntakeLog(intakeId) {
      return [...(logs.get(intakeId) ?? [])]
    },
    async listDocuments(intakeId) {
      return [...documents.values()].filter((document) => document.intakeId === intakeId)
    },
    async addDocument(record) {
      documents.set(`${record.intakeId}:${record.id}`, record)
      return record
    },
    async getDocument(intakeId, documentId) {
      return documents.get(`${intakeId}:${documentId}`) ?? null
    },
    async markDocumentUploaded(intakeId, documentId) {
      const key = `${intakeId}:${documentId}`
      const document = documents.get(key)
      if (!document) return null
      const updated: DocumentRecord = { ...document, status: 'uploaded' }
      documents.set(key, updated)
      return updated
    },
    snapshot() {
      return {
        intakes: [...intakes.values()],
        documents: [...documents.values()],
        logs: [...logs.values()].flat(),
      }
    },
  }
}