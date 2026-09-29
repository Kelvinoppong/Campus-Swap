import { z } from 'zod';
import { ALLOWED_IMAGE_MIME_TYPES, LIMITS } from './constants';

/**
 * The phone uploads photo bytes straight to S3/R2 with a presigned URL, so the
 * API never handles the file itself. It only signs, and only for image types
 * under the size cap.
 */
export const presignUploadSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  contentLength: z.number().int().positive().max(LIMITS.maxUploadBytes),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export interface PresignUploadResponse {
  /** PUT the raw bytes here with the same Content-Type. */
  uploadUrl: string;
  /** Send this back when creating the listing. */
  storageKey: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
}
