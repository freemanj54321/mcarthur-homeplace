import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

// Run the REAL createCollectionStore against the in-memory firebase-admin mock.
vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

import { createCollectionStore } from '@/lib/cms/collectionStore'
import { resetFirebaseAdminMock, getMockDb } from '@/test/firebaseAdminMock'

const schema = z.object({ slug: z.string(), title: z.string() })
type Input = z.infer<typeof schema>

const COL = 'widgets'
const store = createCollectionStore<Input>({ collection: COL, schema, slugField: 'slug' })
const noSlugStore = createCollectionStore<Input>({ collection: 'noslug', schema })

beforeEach(() => resetFirebaseAdminMock())

describe('createCollectionStore', () => {
  describe('create + getById (toStored envelope)', () => {
    it('stores input under a fresh draft envelope at order 0', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      const doc = await store.getById(id)
      expect(doc).toMatchObject({
        id,
        slug: 'a',
        title: 'A',
        order: 0,
        status: 'draft',
        publishedSnapshot: null,
        publishedAt: null,
        createdBy: 'ed1',
        updatedBy: 'ed1',
      })
      expect(doc!.createdAt).toBeGreaterThan(0)
      expect(doc!.updatedAt).toBeGreaterThan(0)
    })

    it('returns null for a missing id', async () => {
      expect(await store.getById('nope')).toBeNull()
    })
  })

  describe('nextOrder', () => {
    it('assigns incrementing order across creates', async () => {
      await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.create({ slug: 'b', title: 'B' }, 'ed1')
      await store.create({ slug: 'c', title: 'C' }, 'ed1')
      const all = await store.list()
      expect(all.map((d) => d.order)).toEqual([0, 1, 2])
      expect(all.map((d) => d.slug)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('assertSlugFree', () => {
    it('rejects creating a second record with the same slug', async () => {
      await store.create({ slug: 'dup', title: 'first' }, 'ed1')
      await expect(store.create({ slug: 'dup', title: 'second' }, 'ed1')).rejects.toThrow(
        /already exists/,
      )
    })

    it('does not enforce slug uniqueness when the collection has no slug field', async () => {
      await noSlugStore.create({ slug: 'shared', title: 'A' }, 'ed1')
      await expect(
        noSlugStore.create({ slug: 'shared', title: 'B' }, 'ed1'),
      ).resolves.toBeTypeOf('string')
    })
  })

  describe('update', () => {
    it('updates fields and re-stamps updatedBy', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.update(id, { slug: 'a', title: 'A2' }, 'ed2')
      expect(await store.getById(id)).toMatchObject({ title: 'A2', updatedBy: 'ed2' })
    })

    it('throws when the record does not exist', async () => {
      await expect(store.update('nope', { slug: 'x', title: 'X' }, 'ed1')).rejects.toThrow(
        /not found/,
      )
    })

    it('rejects changing the slug to one already taken', async () => {
      await store.create({ slug: 'a', title: 'A' }, 'ed1')
      const id2 = await store.create({ slug: 'b', title: 'B' }, 'ed1')
      await expect(store.update(id2, { slug: 'a', title: 'B' }, 'ed1')).rejects.toThrow(
        /already exists/,
      )
    })

    it('allows keeping the same slug on update', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await expect(store.update(id, { slug: 'a', title: 'A2' }, 'ed1')).resolves.toBeUndefined()
    })
  })

  describe('publish / unpublish lifecycle + publicView', () => {
    it('hides drafts from the public read paths', async () => {
      await store.create({ slug: 'a', title: 'A' }, 'ed1')
      expect(await store.listPublished()).toEqual([])
      expect(await store.getPublishedBySlug('a')).toBeNull()
    })

    it('publishes a frozen snapshot and exposes the public view', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.publish(id, 'ed1')

      const expected = { id, order: 0, slug: 'a', title: 'A' }
      expect(await store.listPublished()).toEqual([expected])
      expect(await store.getPublishedBySlug('a')).toEqual(expected)

      const raw = getMockDb().raw(COL, id)
      expect(raw!.status).toBe('published')
      expect(raw!.publishedSnapshot).toEqual({ slug: 'a', title: 'A' })
    })

    it('serves the published snapshot, not later draft edits', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.publish(id, 'ed1')
      await store.update(id, { slug: 'a', title: 'A-edited' }, 'ed1')

      // Public view stays frozen at the published snapshot…
      expect(await store.getPublishedBySlug('a')).toEqual({ id, order: 0, slug: 'a', title: 'A' })
      // …while the admin view reflects the live draft edit.
      expect((await store.getById(id))!.title).toBe('A-edited')
    })

    it('unpublish removes it from the public view again', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.publish(id, 'ed1')
      await store.unpublish(id, 'ed1')
      expect(await store.listPublished()).toEqual([])
    })

    it('exposes the published view with only schema + identity keys', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.publish(id, 'ed1')
      const pub = (await store.listPublished())[0]
      expect(Object.keys(pub).sort()).toEqual(['id', 'order', 'slug', 'title'])
    })

    it('lists published slugs', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.create({ slug: 'b', title: 'B' }, 'ed1') // left as draft
      await store.publish(id, 'ed1')
      expect(await store.listPublishedSlugs()).toEqual(['a'])
    })
  })

  describe('reorder', () => {
    it('swaps order with the previous record (up) then the next (down)', async () => {
      await store.create({ slug: 'a', title: 'A' }, 'ed1')
      const b = await store.create({ slug: 'b', title: 'B' }, 'ed1')

      await store.reorder(b, 'up', 'ed1')
      expect((await store.list()).map((d) => d.slug)).toEqual(['b', 'a'])

      await store.reorder(b, 'down', 'ed1')
      expect((await store.list()).map((d) => d.slug)).toEqual(['a', 'b'])
    })

    it('is a no-op at the boundary', async () => {
      const a = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.create({ slug: 'b', title: 'B' }, 'ed1')
      await store.reorder(a, 'up', 'ed1') // already first
      expect((await store.list()).map((d) => d.slug)).toEqual(['a', 'b'])
    })

    it('ignores an unknown id', async () => {
      await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await expect(store.reorder('nope', 'up', 'ed1')).resolves.toBeUndefined()
    })
  })

  describe('remove', () => {
    it('deletes a record', async () => {
      const id = await store.create({ slug: 'a', title: 'A' }, 'ed1')
      await store.remove(id)
      expect(await store.getById(id)).toBeNull()
    })
  })

  describe('slug-field guards', () => {
    it('getPublishedBySlug throws when the collection has no slug field', async () => {
      await expect(noSlugStore.getPublishedBySlug('x')).rejects.toThrow(/no slug field/)
    })

    it('listPublishedSlugs throws when the collection has no slug field', async () => {
      await expect(noSlugStore.listPublishedSlugs()).rejects.toThrow(/no slug field/)
    })
  })
})
