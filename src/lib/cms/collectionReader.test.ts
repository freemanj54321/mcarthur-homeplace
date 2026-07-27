import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { z } from 'zod'

// NOTE: deliberately NO `vi.mock('@/lib/firebase-admin')` in this file.
// The whole point of MCA-26 is that the read layer runs on an injected
// accessor with no Admin SDK anywhere in the graph — mocking it here would
// hide a regression rather than catch one.
import { createCollectionReader, tsToMillis } from '@/lib/cms/collectionReader'
import type { FirestoreReader } from '@/lib/cms/firestoreReader'
import { createFakeFirestore, type FakeFirestore } from '@/test/firestoreMock'

const schema = z.object({ slug: z.string(), title: z.string() })
type Input = z.infer<typeof schema>

const COL = 'widgets'

let db: FakeFirestore
const reader = () =>
  createCollectionReader<Input>({
    collection: COL,
    schema,
    slugField: 'slug',
    db: () => db as unknown as FirestoreReader,
  })

/** Seed a doc with a full envelope; `over` tweaks individual fields. */
function seed(id: string, over: Record<string, unknown> = {}): void {
  db.seed(COL, id, {
    slug: id,
    title: id.toUpperCase(),
    order: 0,
    status: 'draft',
    publishedSnapshot: null,
    publishedAt: null,
    createdBy: 'ed1',
    createdAt: 1_000,
    updatedBy: 'ed1',
    updatedAt: 1_000,
    ...over,
  })
}

beforeEach(() => {
  db = createFakeFirestore()
})

describe('createCollectionReader', () => {
  describe('transport independence', () => {
    it('reads through a hand-rolled accessor with no Firestore SDK at all', async () => {
      // The narrowest thing that satisfies the port: plain objects.
      const stub: FirestoreReader = {
        collection: () => ({
          where() {
            return this
          },
          get: async () => ({
            docs: [
              {
                id: 'x',
                exists: true,
                data: () => ({ slug: 'x', title: 'X', status: 'published', order: 0 }),
              },
            ],
          }),
          doc: () => ({ get: async () => ({ id: 'x', exists: false, data: () => undefined }) }),
        }),
      }
      const r = createCollectionReader<Input>({ collection: COL, schema, slugField: 'slug', db: () => stub })
      expect(await r.listPublished()).toEqual([{ id: 'x', order: 0, slug: 'x', title: 'X' }])
    })

    it('does not import firebase, next, or server-only', () => {
      // Guard the contract itself — a stray import here would silently drag the
      // Admin SDK back into the content API's dependency graph (MCA-53).
      for (const file of ['collectionReader.ts', 'firestoreReader.ts']) {
        const src = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')
        expect(src, file).not.toMatch(/from\s+['"](firebase|firebase-admin|next|server-only)/)
        expect(src, file).not.toMatch(/@\/lib\/firebase/)
      }
    })
  })

  describe('list + ordering', () => {
    it('sorts by ascending order by default', async () => {
      seed('c', { order: 2 })
      seed('a', { order: 0 })
      seed('b', { order: 1 })
      expect((await reader().list()).map((d) => d.slug)).toEqual(['a', 'b', 'c'])
    })

    it('honours a custom comparator', async () => {
      seed('old', { updatedAt: 100 })
      seed('new', { updatedAt: 900 })
      const r = createCollectionReader<Input>({
        collection: COL,
        schema,
        slugField: 'slug',
        db: () => db as unknown as FirestoreReader,
        compare: (a, b) => b.updatedAt - a.updatedAt,
      })
      expect((await r.list()).map((d) => d.slug)).toEqual(['new', 'old'])
    })

    it('defaults a missing order field to 0', async () => {
      db.seed(COL, 'x', { slug: 'x', title: 'X', status: 'draft' })
      expect((await reader().getById('x'))!.order).toBe(0)
    })
  })

  describe('published views', () => {
    it('hides drafts', async () => {
      seed('a')
      expect(await reader().listPublished()).toEqual([])
      expect(await reader().getPublishedBySlug('a')).toBeNull()
    })

    it('prefers the frozen snapshot over live fields', async () => {
      seed('a', {
        status: 'published',
        title: 'live-edit',
        publishedSnapshot: { slug: 'a', title: 'frozen' },
      })
      expect(await reader().getPublishedBySlug('a')).toEqual({
        id: 'a',
        order: 0,
        slug: 'a',
        title: 'frozen',
      })
    })

    it('falls back to live fields when no snapshot was stored', async () => {
      seed('a', { status: 'published', publishedSnapshot: null })
      expect(await reader().getPublishedBySlug('a')).toEqual({
        id: 'a',
        order: 0,
        slug: 'a',
        title: 'A',
      })
    })

    it('exposes only schema + identity keys', async () => {
      seed('a', { status: 'published' })
      const pub = (await reader().listPublished())[0]
      expect(Object.keys(pub).sort()).toEqual(['id', 'order', 'slug', 'title'])
    })

    it('picks the published doc when several share a slug', async () => {
      seed('dup1', { slug: 'shared', status: 'draft' })
      seed('dup2', { slug: 'shared', status: 'published', title: 'the-published-one' })
      expect(await reader().getPublishedBySlug('shared')).toMatchObject({ title: 'the-published-one' })
    })

    it('lists published slugs only', async () => {
      seed('a', { status: 'published' })
      seed('b')
      expect(await reader().listPublishedSlugs()).toEqual(['a'])
    })

    it('takes published slugs from the doc root, not the snapshot', async () => {
      // Published under one slug, then renamed in draft. getPublishedBySlug
      // matches the root field, so the prerendered path must use it too or
      // generateStaticParams emits a route the lookup cannot resolve.
      seed('a', {
        status: 'published',
        slug: 'renamed',
        publishedSnapshot: { slug: 'stale-slug', title: 'A' },
      })
      expect(await reader().listPublishedSlugs()).toEqual(['renamed'])
      expect(await reader().getPublishedBySlug('renamed')).not.toBeNull()
    })

    it('survives a snapshot that omits the slug entirely', async () => {
      seed('legacy', { status: 'published', publishedSnapshot: { title: 'frozen' } })
      expect(await reader().listPublishedSlugs()).toEqual(['legacy'])
    })
  })

  describe('getBySlug (draft-inclusive, backs admin preview)', () => {
    it('returns a draft', async () => {
      seed('a')
      expect(await reader().getBySlug('a')).toMatchObject({ id: 'a', status: 'draft' })
    })

    it('returns null when nothing matches', async () => {
      expect(await reader().getBySlug('nope')).toBeNull()
    })
  })

  describe('getById', () => {
    it('returns null for a missing id', async () => {
      expect(await reader().getById('nope')).toBeNull()
    })
  })

  describe('slug-field guards', () => {
    const noSlug = () =>
      createCollectionReader<Input>({
        collection: 'noslug',
        schema,
        db: () => db as unknown as FirestoreReader,
      })

    it('getPublishedBySlug throws without a slug field', async () => {
      await expect(noSlug().getPublishedBySlug('x')).rejects.toThrow(/no slug field/)
    })

    it('getBySlug throws without a slug field', async () => {
      await expect(noSlug().getBySlug('x')).rejects.toThrow(/no slug field/)
    })

    it('listPublishedSlugs throws without a slug field', async () => {
      await expect(noSlug().listPublishedSlugs()).rejects.toThrow(/no slug field/)
    })
  })

  describe('resilience when the backend is unavailable', () => {
    const broken: FirestoreReader = {
      collection: () => ({
        where() {
          return this
        },
        get: async () => {
          throw new Error('no credentials')
        },
        doc: () => ({
          get: async () => {
            throw new Error('no credentials')
          },
        }),
      }),
    }
    const r = createCollectionReader<Input>({ collection: COL, schema, slugField: 'slug', db: () => broken })

    it('degrades to empty/null instead of throwing, so prerender survives', async () => {
      expect(await r.list()).toEqual([])
      expect(await r.listPublished()).toEqual([])
      expect(await r.getById('a')).toBeNull()
      expect(await r.getBySlug('a')).toBeNull()
      expect(await r.getPublishedBySlug('a')).toBeNull()
    })
  })
})

describe('tsToMillis', () => {
  it('passes millisecond numbers through', () => {
    expect(tsToMillis(1234)).toBe(1234)
  })

  it('duck-types any Timestamp exposing toMillis()', () => {
    expect(tsToMillis({ toMillis: () => 999 })).toBe(999)
  })

  it('returns null for absent or unrecognised values', () => {
    expect(tsToMillis(undefined)).toBeNull()
    expect(tsToMillis(null)).toBeNull()
    expect(tsToMillis('nope')).toBeNull()
    expect(tsToMillis({})).toBeNull()
  })
})
