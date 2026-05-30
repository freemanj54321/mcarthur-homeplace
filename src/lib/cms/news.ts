import { z } from 'zod'
import { createCollectionStore, type StoredDoc, type PublicDoc } from './collectionStore'
import { ContentImage, slugSchema } from './media'

export const NewsInput = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200),
  date: z.string().max(40),
  category: z.string().max(80),
  /** Fallback label shown by <Placeholder> when no image is set. */
  placeholder: z.string().max(200),
  excerpt: z.string().max(1200),
  content: z.string().max(20000),
  image: ContentImage.nullable(),
})
export type NewsInput = z.infer<typeof NewsInput>

export type NewsDoc = StoredDoc<NewsInput>
export type NewsItem = PublicDoc<NewsInput>

export const newsStore = createCollectionStore<NewsInput>({
  collection: 'news',
  schema: NewsInput,
  slugField: 'slug',
})
