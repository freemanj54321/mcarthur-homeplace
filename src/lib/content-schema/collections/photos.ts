import { z } from 'zod'

// Photos don't use the draft/published envelope (StoredDoc/PublicDoc): a photo
// is public once it has a `project` or `featured`, and unassigned photos (e.g.
// the MCA-90 legacy import) appear only in /admin/photos.

export const PHOTO_CATEGORIES = ['exterior', 'interior', 'detail', 'landscape', 'archival'] as const
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]

export const PhotoInput = z.object({
  filename: z.string(),
  storagePath: z.string().min(1),
  downloadUrl: z.string().url(),
  caption: z.string().max(400),
  altText: z.string().max(400),
  project: z.string().nullable(),
  category: z.enum(PHOTO_CATEGORIES),
  featured: z.boolean(),
  /** Negative means "append after the last photo". */
  order: z.number().int(),
  /** `YYYY-MM-DD`, or '' when unknown. */
  dateTaken: z.string(),
})
export type PhotoInput = z.infer<typeof PhotoInput>

/** Serializable photo shape: safe to pass as props and to return from an API. */
export type PhotoRecord = {
  id: string
  filename: string
  storagePath: string
  downloadUrl: string
  caption: string
  altText: string
  project: string | null
  category: PhotoCategory
  featured: boolean
  order: number
  dateTaken: string
  /** Epoch millis. */
  updatedAt: number
  /** Epoch millis. */
  uploadedAt: number
}
