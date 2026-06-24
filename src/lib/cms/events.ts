import { createCollectionStore } from './collectionStore'
import { EventInput } from '@/lib/content-schema'

export const eventsStore = createCollectionStore<EventInput>({
  collection: 'events',
  schema: EventInput,
})
