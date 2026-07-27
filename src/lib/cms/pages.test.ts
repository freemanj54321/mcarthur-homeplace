import { describe, it, expect, beforeEach, vi } from 'vitest'

// pages.ts still owns the write path via the Admin SDK, so it needs the mock.
// The READ path underneath it is the transport-agnostic reader (MCA-26).
vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

import {
  listPages,
  getPageById,
  getPageBySlug,
  getPublishedPage,
  listPublishedSlugs,
  createPage,
  updatePage,
  publishPage,
  unpublishPage,
  deletePage,
} from '@/lib/cms/pages'
import { resetFirebaseAdminMock, getMockDb } from '@/test/firebaseAdminMock'

const COL = 'pages'
const draft = (slug: string, title = slug.toUpperCase()) => ({
  slug,
  title,
  hero: null,
  sections: [],
})

/** Seed a raw pages doc so envelope fields can be controlled exactly. */
function seed(id: string, over: Record<string, unknown> = {}): void {
  getMockDb().seed(COL, id, {
    slug: id,
    title: id.toUpperCase(),
    hero: null,
    sections: [],
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

beforeEach(() => resetFirebaseAdminMock())

describe('pages read path', () => {
  describe('getPublishedPage', () => {
    it('returns null for a draft', async () => {
      seed('about')
      expect(await getPublishedPage('about')).toBeNull()
    })

    it('returns null when the slug does not exist', async () => {
      expect(await getPublishedPage('nope')).toBeNull()
    })

    it('serves the frozen snapshot, not later draft edits', async () => {
      seed('about', {
        status: 'published',
        title: 'live-edit',
        publishedSnapshot: { title: 'frozen', hero: null, sections: [] },
      })
      expect(await getPublishedPage('about')).toEqual({
        id: 'about',
        title: 'frozen',
        hero: null,
        sections: [],
      })
    })

    it('falls back to live fields for pages published before snapshots existed', async () => {
      seed('about', { status: 'published', title: 'Legacy', publishedSnapshot: null })
      expect(await getPublishedPage('about')).toMatchObject({ title: 'Legacy' })
    })

    it('still renders legacy docs: narrow snapshot, no order field', async () => {
      // Pages published before MCA-26 stored title/hero/sections without `slug`
      // and carried no `order`. Both must keep working with no data migration.
      getMockDb().seed(COL, 'legacy', {
        slug: 'legacy',
        title: 'live-edit',
        hero: null,
        sections: [],
        status: 'published',
        publishedSnapshot: { title: 'frozen', hero: null, sections: [] },
        createdBy: 'ed1',
        createdAt: 1,
        updatedBy: 'ed1',
        updatedAt: 1,
      })
      expect(await getPublishedPage('legacy')).toEqual({
        id: 'legacy',
        title: 'frozen',
        hero: null,
        sections: [],
      })
      expect(await listPublishedSlugs()).toEqual(['legacy'])
    })

    it('resolves the snapshot so routes never re-implement the fallback', async () => {
      seed('about', { status: 'published' })
      const page = await getPublishedPage('about')
      // The shape public routes render directly.
      expect(Object.keys(page!).sort()).toEqual(['hero', 'id', 'sections', 'title'])
    })
  })

  describe('getPageBySlug (admin preview)', () => {
    it('returns drafts too', async () => {
      seed('about')
      expect(await getPageBySlug('about')).toMatchObject({ slug: 'about', status: 'draft' })
    })

    it('returns null when nothing matches', async () => {
      expect(await getPageBySlug('nope')).toBeNull()
    })
  })

  describe('listPages', () => {
    it('orders newest-edit-first', async () => {
      seed('old', { updatedAt: 100 })
      seed('newest', { updatedAt: 900 })
      seed('mid', { updatedAt: 500 })
      expect((await listPages()).map((p) => p.slug)).toEqual(['newest', 'mid', 'old'])
    })

    it('exposes the PageDoc shape, without the generic order field', async () => {
      seed('about')
      const [page] = await listPages()
      expect(page).not.toHaveProperty('order')
      expect(page).toMatchObject({ id: 'about', slug: 'about', status: 'draft' })
    })
  })

  describe('listPublishedSlugs', () => {
    it('lists published slugs only', async () => {
      seed('shown', { status: 'published' })
      seed('hidden')
      expect(await listPublishedSlugs()).toEqual(['shown'])
    })
  })

  describe('getPageById', () => {
    it('returns null for a missing id', async () => {
      expect(await getPageById('nope')).toBeNull()
    })
  })
})

describe('pages write path', () => {
  it('creates a draft and reads it back', async () => {
    const id = await createPage(draft('about'), 'ed1')
    expect(await getPageById(id)).toMatchObject({
      slug: 'about',
      title: 'ABOUT',
      status: 'draft',
      publishedSnapshot: null,
      createdBy: 'ed1',
    })
  })

  it('rejects a duplicate slug', async () => {
    await createPage(draft('about'), 'ed1')
    await expect(createPage(draft('about'), 'ed1')).rejects.toThrow(/already exists/)
  })

  it('rejects renaming onto a taken slug', async () => {
    await createPage(draft('about'), 'ed1')
    const id = await createPage(draft('visit'), 'ed1')
    await expect(updatePage(id, draft('about'), 'ed1')).rejects.toThrow(/already exists/)
  })

  it('throws when updating a missing page', async () => {
    await expect(updatePage('nope', draft('about'), 'ed1')).rejects.toThrow(/not found/)
  })

  it('publishes the whole input as the snapshot, like every other collection', async () => {
    const id = await createPage(draft('about'), 'ed1')
    await publishPage(id, 'ed1')
    const raw = getMockDb().raw(COL, id)!
    expect(raw.status).toBe('published')
    // Wider than the pre-MCA-26 shape — `slug` is now included.
    expect(Object.keys(raw.publishedSnapshot as object).sort()).toEqual([
      'hero',
      'sections',
      'slug',
      'title',
    ])
    expect(raw.order).toBe(0)
  })

  it('sanitizes rich-text HTML on the way in', async () => {
    const id = await createPage(
      {
        ...draft('about'),
        sections: [{ id: 's1', type: 'richText' as const, html: '<p>ok</p><script>alert(1)</script>' }],
      },
      'ed1',
    )
    const [section] = (await getPageById(id))!.sections
    expect(section).toMatchObject({ type: 'richText' })
    expect((section as { html: string }).html).not.toContain('<script')
  })

  it('deletes a page', async () => {
    const id = await createPage(draft('about'), 'ed1')
    await deletePage(id, 'ed1')
    expect(await getPageById(id)).toBeNull()
  })

  it('unpublish hides it from the public read path again', async () => {
    const id = await createPage(draft('about'), 'ed1')
    await publishPage(id, 'ed1')
    expect(await getPublishedPage('about')).not.toBeNull()
    await unpublishPage(id, 'ed1')
    expect(await getPublishedPage('about')).toBeNull()
  })
})
