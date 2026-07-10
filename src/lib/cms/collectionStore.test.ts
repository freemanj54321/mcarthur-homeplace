import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

import { createCollectionStore } from './collectionStore'
import { resetFirebaseAdminMock } from '@/test/firebaseAdminMock'

beforeEach(() => resetFirebaseAdminMock())

describe('orderBy option', () => {
  it('defaults to ascending order field when not specified', async () => {
    const store = createCollectionStore({
      collection: 'ordered',
      schema: z.object({ name: z.string() }),
    })
    const a = await store.create({ name: 'A' }, 'u')
    const b = await store.create({ name: 'B' }, 'u')
    const c = await store.create({ name: 'C' }, 'u')
    const docs = await store.list()
    expect(docs.map((d) => d.id)).toEqual([a, b, c])
  })

  it('sorts descending by updatedAt when configured', async () => {
    const store = createCollectionStore({
      collection: 'byUpdated',
      schema: z.object({ name: z.string() }),
      orderBy: { field: 'updatedAt', direction: 'desc' },
    })
    const a = await store.create({ name: 'A' }, 'u')
    // Brief tick so timestamps differ in the mock
    await new Promise((r) => setTimeout(r, 5))
    const b = await store.create({ name: 'B' }, 'u')
    await new Promise((r) => setTimeout(r, 5))
    const c = await store.create({ name: 'C' }, 'u')

    const docs = await store.list()
    // Most recently updated first
    expect(docs.map((d) => d.id)).toEqual([c, b, a])
  })
})

describe('snapshotFields option', () => {
  it('defaults to snapshotting all input fields', async () => {
    const store = createCollectionStore({
      collection: 'full',
      schema: z.object({ slug: z.string(), title: z.string() }),
      slugField: 'slug',
    })
    const id = await store.create({ slug: 'x', title: 'X' }, 'u')
    await store.publish(id, 'u')
    const [pub] = await store.listPublished()
    // publishedSnapshot should contain all fields (slug + title)
    expect(pub).toMatchObject({ slug: 'x', title: 'X' })
  })

  it('restricts publishedSnapshot to specified fields', async () => {
    const store = createCollectionStore({
      collection: 'partial',
      schema: z.object({ slug: z.string(), title: z.string(), body: z.string() }),
      slugField: 'slug',
      snapshotFields: ['title', 'body'],
    })
    const id = await store.create({ slug: 'y', title: 'Y', body: 'content' }, 'u')
    await store.publish(id, 'u')

    const doc = await store.getById(id)
    // Runtime snapshot excludes slug
    expect(doc?.publishedSnapshot).toEqual({ title: 'Y', body: 'content' })
    expect((doc?.publishedSnapshot as Record<string, unknown>)?.slug).toBeUndefined()
  })
})

describe('db injection seam', () => {
  it('uses injected accessor instead of adminDb', async () => {
    const { createFakeFirestore } = await import('@/test/firestoreMock')
    const altDb = createFakeFirestore()

    const store = createCollectionStore({
      collection: 'injected',
      schema: z.object({ name: z.string() }),
      db: (name) => altDb.collection(name),
    })

    const id = await store.create({ name: 'injected-doc' }, 'u')
    const doc = await store.getById(id)
    expect(doc?.name).toBe('injected-doc')

    // Confirm doc landed in altDb, not the default mocked adminDb
    const { getMockDb } = await import('@/test/firebaseAdminMock')
    const defaultSnap = await getMockDb().collection('injected').get()
    expect(defaultSnap.size).toBe(0)
  })
})
