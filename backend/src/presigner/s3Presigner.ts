import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { ApiConfig } from '../config.js'
import type {
  CreateUploadLocationInput,
  UploadLocation,
  UploadUrlPresigner,
  UploadUrlValidation,
} from './presigner.js'

export function createS3Presigner(
  config: Pick<ApiConfig, 'awsBucketName' | 'awsRegion' | 'uploadUrlExpirySeconds'> & {
    presignSecret?: string
    localPresignerMode?: 'signed' | 'mock'
  },
): UploadUrlPresigner {
  // No explicit `credentials`: the SDK default provider chain resolves them.
  // Locally that is the ambient AWS_* env values (matching the previous
  // explicit passthrough); in Lambda it is the execution role, since Lambda
  // reserves AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY and they cannot be set.
  const client = new S3Client({
    region: config.awsRegion,
  })

  return {
    async createUploadLocation(input: CreateUploadLocationInput): Promise<UploadLocation> {
      const expiresAt = Date.now() + config.uploadUrlExpirySeconds * 1000
      const command = new PutObjectCommand({
        Bucket: config.awsBucketName,
        Key: input.objectKey,
        ContentType: input.contentType,
        Metadata: {
          intakeId: input.intakeId,
          documentId: input.documentId,
        },
      })

      const url = await getSignedUrl(client, command, { expiresIn: config.uploadUrlExpirySeconds })
      return {
        url,
        objectKey: input.objectKey,
        expiresAt: new Date(expiresAt),
      }
    },
    verifyUploadUrl(documentId: string, token: string, intakeId?: string): UploadUrlValidation {
      if (!token && intakeId) {
        return { ok: true, intakeId, documentId }
      }
      return { ok: false }
    },
  }
}
