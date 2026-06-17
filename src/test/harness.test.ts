import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

// Self-test for the WS0 test harness: proves the `server-only` alias, the `@/`
// path alias, vi.mock of firebase-admin, and serverTimestamp materialization
// all work together by running the REAL createCollectionStore against the
// in-memory mock. The full store lifecycle suite is WS1 (MCA-19).
vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

import { createCollectionStore } from '@/lib/cms/collectionStore'
import { resetFirebaseAdminMock } from '@/test/firebaseAdminMock'

const schema = z.object({ slug: z.string(), title: z.string() })
const store = createCollectionStore({ collection: 'widgets', schema, slugField: 'slug' })

beforeEach(() => resetFirebaseAdminMock())

describe('test harness', () => {
  it('round-trips a create through the mocked Admin SDK', async () => {
    const id = await store.create({ slug: 'a', title: 'A' }, 'editor-1')
    const doc = await store.getById(id)
    expect(doc).toMatchObject({ slug: 'a', title: 'A', status: 'draft', createdBy: 'editor-1' })
  })

  it('exposes published docs as the public view after publish', async () => {
    const id = await store.create({ slug: 'b', title: 'B' }, 'editor-1')
    expect(await store.listPublished()).toHaveLength(0)
    await store.publish(id, 'editor-1')
    expect(await store.listPublished()).toEqual([{ id, order: 0, slug: 'b', title: 'B' }])
  })
})
