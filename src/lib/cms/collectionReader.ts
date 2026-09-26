/**
 * Transport-agnostic content READ layer (MCA-26).
 *
 * Deliberately imports no `firebase-admin`, no `server-only`, and no Next.js:
 * everything Firestore-shaped arrives through the injected
 * `FirestoreReaderAccessor` port. `collectionStore.ts` composes this with the
 * Admin SDK for the website/admin write paths; the content API (MCA-53) can
 * compose the same reader with whatever accessor its runtime provides.
 */
import type { z } from 'zod'
import type { Status, StoredDoc, PublicDoc } from '@/lib/content-schema'
import type { FirestoreReaderAccessor, ReadDocData } from './firestoreReader'

/**
 * Firestore `Timestamp` duck-type. WHY not `instanceof Timestamp`: that would
 * require importing `firebase-admin/firestore` here and defeat the point of
 * this module. `toMillis()` is present on both the Admin and client SDK
 * Timestamp classes, and raw millisecond numbers pass through unchanged.
 */
export function tsToMillis(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis(): number }).toMillis()
  }
  return null
}

export type CollectionReaderOptions<TInput extends Record<string, unknown>> = {
  collection: string
  schema: z.ZodType<TInput>
  /** Field used for slug lookups + uniqueness, if the collection has one. */
  slugField?: keyof TInput & string
  /** Resolves the backing Firestore — the whole point of this module. */
  db: FirestoreReaderAccessor
  /**
   * In-memory sort for `list()`. Defaults to ascending `order`. Sorting here
   * rather than via `orderBy` keeps these reads off composite indexes, which
   * fail silently when absent (see MCA-41 / ONBOARDING decision 7).
   */
  compare?: (a: StoredDoc<TInput>, b: StoredDoc<TInput>) => number
}

export type CollectionReader<TInput extends Record<string, unknown>> = ReturnType<
  typeof createCollectionReader<TInput>
>

export function createCollectionReader<TInput extends Record<string, unknown>>(
  opts: CollectionReaderOptions<TInput>,
) {
  const { collection, schema, slugField, db } = opts
  const compare = opts.compare ?? ((a, b) => a.order - b.order)
  const col = () => db().collection(collection)

  function toStored(id: string, data: ReadDocData): StoredDoc<TInput> {
    return {
      ...(data as unknown as TInput),
      id,
      order: typeof data.order === 'number' ? data.order : 0,
      status: (data.status ?? 'draft') as Status,
      publishedSnapshot: (data.publishedSnapshot ?? null) as TInput | null,
      publishedAt: tsToMillis(data.publishedAt),
      createdBy: (data.createdBy ?? '') as string,
      createdAt: tsToMillis(data.createdAt) ?? 0,
      updatedBy: (data.updatedBy ?? '') as string,
      updatedAt: tsToMillis(data.updatedAt) ?? 0,
    }
  }

  /** Editable fields only, stripped of the envelope (Zod drops unknown keys). */
  function inputOf(data: ReadDocData): TInput {
    return schema.parse(data)
  }

  /**
   * The published view: the frozen snapshot when there is one, else the live
   * fields. Callers never have to re-implement this fallback.
   */
  function publicView(doc: StoredDoc<TInput>): PublicDoc<TInput> {
    const fields = doc.publishedSnapshot ?? inputOf(doc as unknown as ReadDocData)
    return { ...fields, id: doc.id, order: doc.order }
  }

  function requireSlugField(): keyof TInput & string {
    if (!slugField) throw new Error(`Collection "${collection}" has no slug field`)
    return slugField
  }

  /**
   * All docs, sorted — admin view with full envelope. Returns [] when the
   * backing Firestore is unavailable (e.g. a local build with no service
   * account), so prerender and ISR stay resilient rather than hard-failing.
   *
   * TODO(MCA-32): swallowing here is silent; replace with a logged fallback.
   */
  async function list(): Promise<StoredDoc<TInput>[]> {
    try {
      const snap = await col().get()
      return snap.docs.map((d) => toStored(d.id, d.data() ?? {})).sort(compare)
    } catch {
      return []
    }
  }

  async function getById(id: string): Promise<StoredDoc<TInput> | null> {
    try {
      const snap = await col().doc(id).get()
      if (!snap.exists) return null
      return toStored(snap.id, snap.data() ?? {})
    } catch {
      // TODO(MCA-32): log instead of swallowing.
      return null
    }
  }

  /** First doc matching the slug regardless of status — drives admin preview. */
  async function getBySlug(slug: string): Promise<StoredDoc<TInput> | null> {
    const field = requireSlugField()
    try {
      const snap = await col().where(field, '==', slug).get()
      const [first] = snap.docs
      return first ? toStored(first.id, first.data() ?? {}) : null
    } catch {
      // TODO(MCA-32): log instead of swallowing.
      return null
    }
  }

  /** Published docs as the public input-shaped view, sorted. */
  async function listPublished(): Promise<PublicDoc<TInput>[]> {
    const all = await list()
    return all.filter((d) => d.status === 'published').map(publicView)
  }

  async function getPublishedBySlug(slug: string): Promise<PublicDoc<TInput> | null> {
    const field = requireSlugField()
    try {
      const snap = await col().where(field, '==', slug).get()
      const match = snap.docs
        .map((d) => toStored(d.id, d.data() ?? {}))
        .find((d) => d.status === 'published')
      return match ? publicView(match) : null
    } catch {
      // TODO(MCA-32): log instead of swallowing.
      return null
    }
  }

  /**
   * Slugs of published docs, read from the DOCUMENT ROOT rather than the
   * published snapshot.
   *
   * WHY: `getPublishedBySlug` matches on the root field, so these two must
   * agree or `generateStaticParams` would prerender paths the lookup cannot
   * resolve. It also keeps working for documents whose snapshot omits the slug
   * (pages published before MCA-26 stored a narrower snapshot), which would
   * otherwise yield `undefined` here.
   */
  async function listPublishedSlugs(): Promise<string[]> {
    const field = requireSlugField()
    const all = await list()
    return all
      .filter((d) => d.status === 'published')
      .map((d) => (d as Record<string, unknown>)[field] as string)
  }

  return {
    collection,
    slugField,
    toStored,
    inputOf,
    publicView,
    list,
    getById,
    getBySlug,
    listPublished,
    getPublishedBySlug,
    listPublishedSlugs,
  }
}
