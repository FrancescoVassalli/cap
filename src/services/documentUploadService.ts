export type UploadedDocument = {
  id: string
  name: string
  url: string
}

export type DocumentUploadService = {
  upload: (file: File, intakeId: string) => Promise<UploadedDocument>
}

export class LocalDocumentUploadService implements DocumentUploadService {
  async upload(file: File, intakeId: string): Promise<UploadedDocument> {
    await new Promise((resolve) => setTimeout(resolve, 150))

    return {
      id: `${intakeId}-${file.name}`,
      name: file.name,
      url: `mock://intakes/${intakeId}/documents/${encodeURIComponent(file.name)}`,
    }
  }
}
