import { describe, it, expect, beforeEach, vi } from 'vitest'

// MCA-115: server actions are the only write path for pages. They run against
// the real pages store over the in-memory Firestore; auth, cache revalidation
// and redirect are mocked at the Next.js boundary.
vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  // Real redirect() throws to stop rendering; mirror that.
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`)
  }),
}))
vi.mock('@/lib/auth/server', () => ({
  requireEditor: vi.fn(async () => ({ uid: 'editor-1', email: null, displayName: null })),
}))

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import { savePageAction, publishPageAction, unpublishPageAction, deletePageAction } from './actions'
import { resetFirebaseAdminMock, getMockDb } from '@/test/firebaseAdminMock'

const draft = { slug: 'about', title: 'Our Story', hero: null, sections: [] }
const paths = () => vi.mocked(revalidatePath).mock.calls.map((c) => c[0])

beforeEach(() => {
  resetFirebaseAdminMock()
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(requireEditor).mockClear()
})

describe('savePageAction', () => {
  it('creates a draft stamped with the editor', async () => {
    const res = await savePageAction(null, draft)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(getMockDb().raw('pages', res.id)).toMatchObject({ slug: 'about', status: 'draft', createdBy: 'editor-1' })
    expect(paths()).toEqual(['/admin/pages'])
  })

  it('updates an existing page and refreshes its preview', async () => {
    const created = await savePageAction(null, draft)
    if (!created.ok) throw new Error('setup')
    vi.mocked(revalidatePath).mockClear()
    const res = await savePageAction(created.id, { ...draft, title: 'New title' })
    expect(res).toEqual({ ok: true, id: created.id })
    expect(getMockDb().raw('pages', created.id)?.title).toBe('New title')
    expect(paths()).toEqual(['/admin/pages', '/admin/preview/about'])
  })

  it('rejects an invalid slug without writing', async () => {
    const res = await savePageAction(null, { ...draft, slug: 'admin/x' })
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining('admin') })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('checks the editor before touching the store', async () => {
    vi.mocked(requireEditor).mockRejectedValueOnce(new Error('NEXT_REDIRECT:/admin/login'))
    await expect(savePageAction(null, draft)).rejects.toThrow('/admin/login')
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('publish / unpublish', () => {
  it('publishes and revalidates the public path', async () => {
    const created = await savePageAction(null, draft)
    if (!created.ok) throw new Error('setup')
    vi.mocked(revalidatePath).mockClear()
    expect(await publishPageAction(created.id)).toEqual({ ok: true })
    expect(getMockDb().raw('pages', created.id)?.status).toBe('published')
    expect(paths()).toEqual(['/admin/pages', '/about'])

    expect(await unpublishPageAction(created.id)).toEqual({ ok: true })
    expect(getMockDb().raw('pages', created.id)?.status).toBe('draft')
  })

  it('reports a missing page instead of throwing', async () => {
    expect(await publishPageAction('nope')).toEqual({ ok: false, error: 'Page not found' })
    expect(await unpublishPageAction('nope')).toEqual({ ok: false, error: 'Page not found' })
  })
})

describe('deletePageAction', () => {
  it('deletes, revalidates the old public path, then redirects to the list', async () => {
    const created = await savePageAction(null, draft)
    if (!created.ok) throw new Error('setup')
    vi.mocked(revalidatePath).mockClear()
    await expect(deletePageAction(created.id)).rejects.toThrow('NEXT_REDIRECT:/admin/pages')
    expect(getMockDb().raw('pages', created.id)).toBeUndefined()
    expect(paths()).toEqual(['/admin/pages', '/about'])
  })
})
