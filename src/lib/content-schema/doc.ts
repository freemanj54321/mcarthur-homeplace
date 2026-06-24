/**
 * Document envelope shared by every structured collection. Pure types — these
 * describe the stored/published shape independent of any storage backend, so
 * both the website and external consumers can rely on them.
 */

export type Status = 'draft' | 'published'

/** Full document as stored — editable input fields plus the publish envelope. */
export type StoredDoc<TInput> = TInput & {
  id: string
  order: number
  status: Status
  publishedSnapshot: TInput | null
  publishedAt: number | null
  createdBy: string
  createdAt: number
  updatedBy: string
  updatedAt: number
}

/** The published view consumed by public pages: input fields + identity only. */
export type PublicDoc<TInput> = TInput & { id: string; order: number }
