import { z } from 'zod'

/** An uploaded image stored in Firebase Storage. Shared by structured content. */
export const ContentImage = z.object({
  storagePath: z.string(),
  // Absolute URL (Firebase Storage) or a same-origin path ("/images/foo.jpg").
  downloadUrl: z
    .string()
    .refine((v) => /^(https?:\/\/|\/)/.test(v), 'must be a URL or absolute path'),
  alt: z.string(),
  caption: z.string().optional(),
})
export type ContentImage = z.infer<typeof ContentImage>

/** Single-segment URL slug: lowercase letters, numbers, hyphen-separated. */
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, numbers and "-" only')
