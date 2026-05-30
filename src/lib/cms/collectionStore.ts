import 'server-only'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase-admin'

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

function tsToMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === 'number') return value
  return null
}

type StoreOptions<TInput extends Record<string, unknown>> = {
  collection: string
  schema: z.ZodType<TInput>
  /** Field used for slug lookups + uniqueness, if the collection has one. */
  slugField?: keyof TInput & string
  /** Optional sanitiser applied to validated input before writing. */
  sanitize?: (input: TInput) => TInput
}

export type CollectionStore<TInput extends Record<string, unknown>> = ReturnType<
  typeof createCollectionStore<TInput>
>

export function createCollectionStore<TInput extends Record<string, unknown>>(
  opts: StoreOptions<TInput>,
) {
  const { collection, schema, slugField, sanitize } = opts
  const col = () => adminDb().collection(collection)

  function toStored(id: string, data: FirebaseFirestore.DocumentData): StoredDoc<TInput> {
    return {
      ...(data as TInput),
      id,
      order: typeof data.order === 'number' ? data.order : 0,
      status: (data.status ?? 'draft') as Status,
      publishedSnapshot: (data.publishedSnapshot ?? null) as TInput | null,
      publishedAt: tsToMillis(data.publishedAt),
      createdBy: data.createdBy ?? '',
      createdAt: tsToMillis(data.createdAt) ?? 0,
      updatedBy: data.updatedBy ?? '',
      updatedAt: tsToMillis(data.updatedAt) ?? 0,
    }
  }

  /** Editable fields only, stripped of the envelope (Zod drops unknown keys). */
  function inputOf(data: FirebaseFirestore.DocumentData): TInput {
    return schema.parse(data)
  }

  function publicView(doc: StoredDoc<TInput>): PublicDoc<TInput> {
    const fields = doc.publishedSnapshot ?? inputOf(doc as unknown as FirebaseFirestore.DocumentData)
    return { ...fields, id: doc.id, order: doc.order }
  }

  /**
   * All docs, ordered — admin view with full envelope. Returns [] if the
   * Admin SDK is unavailable (e.g. local build/dev without a service account),
   * mirroring the navigation read fallback so prerender and ISR stay resilient.
   */
  async function list(): Promise<StoredDoc<TInput>[]> {
    try {
      const snap = await col().get()
      return snap.docs.map((d) => toStored(d.id, d.data())).sort((a, b) => a.order - b.order)
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
      return null
    }
  }

  /** Published docs as the public input-shaped view, ordered. */
  async function listPublished(): Promise<PublicDoc<TInput>[]> {
    const all = await list()
    return all.filter((d) => d.status === 'published').map(publicView)
  }

  async function getPublishedBySlug(slug: string): Promise<PublicDoc<TInput> | null> {
    if (!slugField) throw new Error(`Collection "${collection}" has no slug field`)
    try {
      const snap = await col().where(slugField, '==', slug).get()
      const match = snap.docs
        .map((d) => toStored(d.id, d.data()))
        .find((d) => d.status === 'published')
      return match ? publicView(match) : null
    } catch {
      return null
    }
  }

  async function listPublishedSlugs(): Promise<string[]> {
    if (!slugField) throw new Error(`Collection "${collection}" has no slug field`)
    const published = await listPublished()
    return published.map((d) => (d as Record<string, unknown>)[slugField] as string)
  }

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
    if (clash) throw new Error(`A record with ${slugField} "${slug}" already exists.`)
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
    if (!current) throw new Error('Record not found')
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
    if (!snap.exists) throw new Error('Record not found')
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

  async function remove(id: string): Promise<void> {
    await col().doc(id).delete()
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
