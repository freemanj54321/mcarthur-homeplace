import 'server-only'
import type { z } from 'zod'
import type { CollectionStore } from '@/lib/cms/collectionStore'
import { projectsStore } from '@/lib/cms/projects'
import { newsStore } from '@/lib/cms/news'
import { eventsStore } from '@/lib/cms/events'
import { milestonesStore } from '@/lib/cms/milestones'
import { boardStore } from '@/lib/cms/board'
import { partnersStore } from '@/lib/cms/partners'
import {
  ProjectInput,
  NewsInput,
  EventInput,
  MilestoneInput,
  BoardMemberInput,
  PartnerInput,
  type StoredDoc,
} from '@/lib/content-schema'

export type SaveResult = { ok: true; id: string } | { ok: false; error: string }

/**
 * What the generic admin pages and actions can do with any collection. Input
 * arrives as `unknown` from the client, so `save` validates it against the
 * collection's own schema before writing.
 */
export type Entry = {
  /** Public paths to revalidate after a write. */
  paths: string[]
  /** Revalidate the root layout too (e.g. projects feed the nav dropdown). */
  layout?: boolean
  list(): Promise<StoredDoc<Record<string, unknown>>[]>
  getById(id: string): Promise<StoredDoc<Record<string, unknown>> | null>
  save(id: string | null, input: unknown, uid: string): Promise<SaveResult>
  publish(id: string, uid: string): Promise<void>
  unpublish(id: string, uid: string): Promise<void>
  remove(id: string, uid: string): Promise<void>
  reorder(id: string, direction: 'up' | 'down', uid: string): Promise<void>
}

/**
 * Bind a store to its schema. The generic `T` ties them together, so the
 * parsed input is statically the store's input type: no `any`, no casts
 * (MCA-30). Each collection is typed here; only the resulting `Entry` is
 * collection-agnostic.
 */
function defineEntry<T extends Record<string, unknown>>(
  store: CollectionStore<T>,
  schema: z.ZodType<T>,
  opts: { paths: string[]; layout?: boolean },
): Entry {
  return {
    ...opts,
    list: () => store.list(),
    getById: (id) => store.getById(id),
    async save(id, input, uid) {
      const parsed = schema.safeParse(input)
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }
      }
      if (id) {
        await store.update(id, parsed.data, uid)
        return { ok: true, id }
      }
      return { ok: true, id: await store.create(parsed.data, uid) }
    },
    publish: (id, uid) => store.publish(id, uid),
    unpublish: (id, uid) => store.unpublish(id, uid),
    // Passing the uid stamps `deletedBy` before the delete (audit trail).
    remove: (id, uid) => store.remove(id, uid),
    reorder: (id, direction, uid) => store.reorder(id, direction, uid),
  }
}

export const REGISTRY: Record<string, Entry> = {
  projects: defineEntry(projectsStore, ProjectInput, { paths: ['/', '/what-to-see', '/donate'], layout: true }),
  news: defineEntry(newsStore, NewsInput, { paths: ['/'] }),
  events: defineEntry(eventsStore, EventInput, { paths: ['/', '/visit'] }),
  milestones: defineEntry(milestonesStore, MilestoneInput, { paths: ['/about'] }),
  boardMembers: defineEntry(boardStore, BoardMemberInput, { paths: ['/about'] }),
  partners: defineEntry(partnersStore, PartnerInput, { paths: ['/about'] }),
}

export function getEntry(collection: string): Entry | null {
  // Own keys only: `collection` comes from the URL / client, and a plain
  // lookup would hand back inherited members like REGISTRY['constructor'].
  return Object.hasOwn(REGISTRY, collection) ? REGISTRY[collection] : null
}
