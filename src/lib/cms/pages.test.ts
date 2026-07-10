import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

import {
  listPages,
  getPageById,
  getPublishedPage,
  getPageBySlug,
  listPublishedSlugs,
  createPage,
  updatePage,
  publishPage,
  unpublishPage,
  deletePage,
} from './pages'
import { resetFirebaseAdminMock } from '@/test/firebaseAdminMock'

const EDITOR = 'editor-1'
const PAGE: import('./sections').PageDraftInput = {
  slug: 'about',
  title: 'About Us',
  hero: null,
  sections: [],
}

beforeEach(() => resetFirebaseAdminMock())

describe('createPage / getPageById round-trip', () => {
  it('creates a draft and retrieves it by id', async () => {
    const id = await createPage(PAGE, EDITOR)
    const doc = await getPageById(id)
    expect(doc).toMatchObject({ slug: 'about', title: 'About Us', status: 'draft', createdBy: EDITOR })
  })

  it('prevents duplicate slugs', async () => {
    await createPage(PAGE, EDITOR)
    await expect(createPage(PAGE, EDITOR)).rejects.toThrow(/already exists/)
  })
})

describe('publishPage / getPublishedPage', () => {
  it('returns null for unpublished slugs', async () => {
    await createPage(PAGE, EDITOR)
    expect(await getPublishedPage('about')).toBeNull()
  })

  it('returns the page after publishing', async () => {
    const id = await createPage(PAGE, EDITOR)
    await publishPage(id, EDITOR)
    const pub = await getPublishedPage('about')
    // slug is intentionally excluded from the page publishedSnapshot (snapshotFields)
    // so the public view has title/hero/sections but not slug
    expect(pub).toMatchObject({ title: 'About Us' })
    expect((pub as Record<string, unknown>)?.slug).toBeUndefined()
  })

  it('publishedSnapshot excludes slug (snapshotFields = title/hero/sections)', async () => {
    const id = await createPage(PAGE, EDITOR)
    await publishPage(id, EDITOR)
    const doc = await getPageById(id)
    const snap = doc?.publishedSnapshot as Record<string, unknown> | null
    expect(snap).not.toBeNull()
    expect(snap?.title).toBe('About Us')
    expect(snap?.slug).toBeUndefined()
  })

  it('unpublishes back to draft', async () => {
    const id = await createPage(PAGE, EDITOR)
    await publishPage(id, EDITOR)
    await unpublishPage(id, EDITOR)
    expect(await getPublishedPage('about')).toBeNull()
    const doc = await getPageById(id)
    expect(doc?.status).toBe('draft')
  })
})

describe('getPageBySlug', () => {
  it('finds draft pages (unlike getPublishedPage)', async () => {
    await createPage(PAGE, EDITOR)
    const bySlug = await getPageBySlug('about')
    expect(bySlug?.slug).toBe('about')
    expect(bySlug?.status).toBe('draft')
    expect(await getPublishedPage('about')).toBeNull()
  })
})

describe('listPages ordering', () => {
  it('returns pages most-recently-updated first', async () => {
    const a = await createPage({ ...PAGE, slug: 'page-a', title: 'A' }, EDITOR)
    await new Promise((r) => setTimeout(r, 5))
    await createPage({ ...PAGE, slug: 'page-b', title: 'B' }, EDITOR)
    await new Promise((r) => setTimeout(r, 5))
    await updatePage(a, { ...PAGE, slug: 'page-a', title: 'A updated' }, EDITOR)

    const pages = await listPages()
    expect(pages[0].slug).toBe('page-a')
    expect(pages[1].slug).toBe('page-b')
  })
})

describe('listPublishedSlugs', () => {
  it('returns only published page slugs', async () => {
    const id = await createPage(PAGE, EDITOR)
    await createPage({ ...PAGE, slug: 'other' }, EDITOR)
    await publishPage(id, EDITOR)
    const slugs = await listPublishedSlugs()
    expect(slugs).toContain('about')
    expect(slugs).not.toContain('other')
  })
})

describe('deletePage', () => {
  it('removes the page', async () => {
    const id = await createPage(PAGE, EDITOR)
    await deletePage(id, EDITOR)
    expect(await getPageById(id)).toBeNull()
  })
})
