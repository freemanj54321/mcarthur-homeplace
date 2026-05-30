import 'server-only'
import type { z } from 'zod'
import { projectsStore, ProjectInput } from '@/lib/cms/projects'
import { newsStore, NewsInput } from '@/lib/cms/news'
import { eventsStore, EventInput } from '@/lib/cms/events'
import { milestonesStore, MilestoneInput } from '@/lib/cms/milestones'
import { boardStore, BoardMemberInput } from '@/lib/cms/board'
import { partnersStore, PartnerInput } from '@/lib/cms/partners'
import type { StoredDoc } from '@/lib/cms/collectionStore'

/** Minimal store surface used by the generic admin actions/list. */
type AnyStore = {
  list(): Promise<StoredDoc<Record<string, unknown>>[]>
  getById(id: string): Promise<StoredDoc<Record<string, unknown>> | null>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(input: any, uid: string): Promise<string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(id: string, input: any, uid: string): Promise<void>
  publish(id: string, uid: string): Promise<void>
  unpublish(id: string, uid: string): Promise<void>
  remove(id: string): Promise<void>
  reorder(id: string, direction: 'up' | 'down', uid: string): Promise<void>
}

type Entry = {
  store: AnyStore
  schema: z.ZodTypeAny
  /** Public paths to revalidate after a write. */
  paths: string[]
  /** Revalidate the root layout too (e.g. projects feed the nav dropdown). */
  layout?: boolean
}

export const REGISTRY: Record<string, Entry> = {
  projects: { store: projectsStore as unknown as AnyStore, schema: ProjectInput, paths: ['/', '/what-to-see', '/donate'], layout: true },
  news: { store: newsStore as unknown as AnyStore, schema: NewsInput, paths: ['/'] },
  events: { store: eventsStore as unknown as AnyStore, schema: EventInput, paths: ['/', '/visit'] },
  milestones: { store: milestonesStore as unknown as AnyStore, schema: MilestoneInput, paths: ['/about'] },
  boardMembers: { store: boardStore as unknown as AnyStore, schema: BoardMemberInput, paths: ['/about'] },
  partners: { store: partnersStore as unknown as AnyStore, schema: PartnerInput, paths: ['/about'] },
}

export function getEntry(collection: string): Entry | null {
  return REGISTRY[collection] ?? null
}
