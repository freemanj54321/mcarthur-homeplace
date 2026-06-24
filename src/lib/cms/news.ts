import { createCollectionStore } from './collectionStore'
import { NewsInput } from '@/lib/content-schema'

export const newsStore = createCollectionStore<NewsInput>({
  collection: 'news',
  schema: NewsInput,
  slugField: 'slug',
})
