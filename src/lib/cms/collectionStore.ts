import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase-admin'
import type { Status, StoredDoc, PublicDoc } from '@/lib/content-schema'
import { createCollectionReader, type CollectionReader } from './collectionReader'
import type { FirestoreReader } from './firestoreReader'

/**
 * Admin-side store: the transport-agnostic read layer (`collectionReader.ts`)
 * composed with the Admin SDK plus the write/publish path. Reads are delegated
 * — this module owns writes only. See MCA-26.
 */

type StoreOptions<TInput extends Record<string, unknown>> = {
  collection: string
  schema: z.ZodType<TInput>
  /** Field used for slug lookups + uniqueness, if the collection has one. */
  slugField?: keyof TInput & string
  /** Optional sanitiser applied to validated input before writing. */
  sanitize?: (input: TInput) => TInput
  /**
   * Noun used in editor-facing error messages ("A page with slug … already
   * exists"). Defaults to "record".
   */
  label?: string
  /** In-memory sort for `list()`. Defaults to ascending `order`. */
  compare?: (a: StoredDoc<TInput>, b: StoredDoc<TInput>) => number
}

export type CollectionStore<TInput extends Record<string, unknown>> = ReturnType<
  typeof createCollectionStore<TInput>
>

export function createCollectionStore<TInput extends Record<string, unknown>>(
  opts: StoreOptions<TInput>,
) {
  const { collection, schema, slugField, sanitize, compare } = opts
  const label = opts.label ?? 'record'
  const Label = label.charAt(0).toUpperCase() + label.slice(1)

  // The Admin SDK satisfies the read port structurally, so the same accessor
  // backs both halves. Thunked so importing a store never boots credentials.
  const reader: CollectionReader<TInput> = createCollectionReader<TInput>({
    collection,
    schema,
    slugField,
    compare,
    db: () => adminDb() as unknown as FirestoreReader,
  })

  /** Write-side handle — needs `add`/`update`/`delete`, beyond the read port. */
  const col = () => adminDb().collection(collection)

  const {
    list,
    getById,
    getBySlug,
    listPublished,
    getPublishedBySlug,
    listPublishedSlugs,
    inputOf,
  } = reader

  async function nextOrder(): Promise<number> {
    const snap = await col().get()
    const max = snap.docs.reduce((m, d) => {
      const o = d.data().order
      return typeof o === 'number' && o > m ? o : m
    }, -1)
    return max + 1
  }

  async function assertSlugFree(slug: string, exceptId?: string): Promise<void> {
    if (!slugField) return
    const snap = await col().where(slugField, '==', slug).get()
    const clash = snap.docs.find((d) => d.id !== exceptId)
    if (clash) throw new Error(`A ${label} with ${slugField} "${slug}" already exists.`)
  }

  async function create(input: TInput, editorUid: string): Promise<string> {
    const clean = sanitize ? sanitize(input) : input
    if (slugField) await assertSlugFree(clean[slugField] as string)
    const ref = await col().add({
      ...clean,
      order: await nextOrder(),
      status: 'draft' as Status,
      publishedSnapshot: null,
      publishedAt: null,
      createdBy: editorUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedBy: editorUid,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return ref.id
  }

  async function update(id: string, input: TInput, editorUid: string): Promise<void> {
    const current = await getById(id)
    if (!current) throw new Error(`${Label} not found`)
    const clean = sanitize ? sanitize(input) : input
    if (slugField && (clean[slugField] as string) !== (current as Record<string, unknown>)[slugField]) {
      await assertSlugFree(clean[slugField] as string, id)
    }
    await col().doc(id).update({
      ...clean,
      updatedBy: editorUid,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  async function publish(id: string, editorUid: string): Promise<void> {
    const snap = await col().doc(id).get()
    if (!snap.exists) throw new Error(`${Label} not found`)
    const input = inputOf(snap.data() ?? {})
    await col().doc(id).update({
      status: 'published' as Status,
      publishedSnapshot: input,
      publishedAt: FieldValue.serverTimestamp(),
      updatedBy: editorUid,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  async function unpublish(id: string, editorUid: string): Promise<void> {
    await col().doc(id).update({
      status: 'draft' as Status,
      updatedBy: editorUid,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  /**
   * Delete a record. Passing `editorUid` stamps `deletedBy` immediately before
   * the delete, so an audit trigger watching the collection sees who did it —
   * the delete event alone carries no actor. Callers that don't need the audit
   * trail (the generic admin registry) omit it and get a plain delete.
   */
  async function remove(id: string, editorUid?: string): Promise<void> {
    const ref = col().doc(id)
    if (editorUid) {
      await ref.update({
        deletedBy: editorUid,
        updatedBy: editorUid,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    await ref.delete()
  }

  /** Swap order with the adjacent record in the given direction. */
  async function reorder(id: string, direction: 'up' | 'down', editorUid: string): Promise<void> {
    const all = await list()
    const idx = all.findIndex((d) => d.id === id)
    if (idx === -1) return
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= all.length) return
    const a = all[idx]
    const b = all[swapWith]
    const batch = adminDb().batch()
    const stamp = { updatedBy: editorUid, updatedAt: FieldValue.serverTimestamp() }
    batch.update(col().doc(a.id), { order: b.order, ...stamp })
    batch.update(col().doc(b.id), { order: a.order, ...stamp })
    await batch.commit()
  }

  return {
    collection,
    list,
    getById,
    getBySlug,
    listPublished,
    getPublishedBySlug,
    listPublishedSlugs,
    create,
    update,
    publish,
    unpublish,
    remove,
    reorder,
  }
}

export type { StoredDoc, PublicDoc }
