import { z } from 'zod'
import { createCollectionStore, type StoredDoc, type PublicDoc } from './collectionStore'

export const EventInput = z.object({
  title: z.string().min(1).max(200),
  date: z.string().max(40),
  time: z.string().max(80),
  location: z.string().max(200),
  excerpt: z.string().max(1200),
})
export type EventInput = z.infer<typeof EventInput>

export type EventDoc = StoredDoc<EventInput>
export type EventItem = PublicDoc<EventInput>

export const eventsStore = createCollectionStore<EventInput>({
  collection: 'events',
  schema: EventInput,
})
