import { describe, it, expect, beforeEach, vi } from 'vitest'

// MCA-115: nav writes go through these actions only.
vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/server', () => ({
  requireEditor: vi.fn(async () => ({ uid: 'editor-1', email: null, displayName: null })),
}))

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import { savePrimaryNavAction, saveFooterNavAction } from './actions'
import { resetFirebaseAdminMock, getMockDb } from '@/test/firebaseAdminMock'

const link = { id: 'l1', label: 'About', href: '/about', kind: 'internal' }

beforeEach(() => {
  resetFirebaseAdminMock()
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(requireEditor).mockClear()
})

describe('savePrimaryNavAction', () => {
  it('saves the nav and revalidates the root layout (header is on every page)', async () => {
    const res = await savePrimaryNavAction({ utility: [], left: [link], right: [] })
    expect(res).toEqual({ ok: true })
    expect(getMockDb().raw('navigation', 'primary')).toMatchObject({ left: [link], updatedBy: 'editor-1' })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns the failing field path on invalid input', async () => {
    const res = await savePrimaryNavAction({ utility: [], left: [{ ...link, label: '' }], right: [] })
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining('left.0.label') })
    expect(getMockDb().raw('navigation', 'primary')).toBeUndefined()
  })

  it('checks the editor first', async () => {
    vi.mocked(requireEditor).mockRejectedValueOnce(new Error('NEXT_REDIRECT'))
    await expect(savePrimaryNavAction({ utility: [], left: [], right: [] })).rejects.toThrow()
    expect(getMockDb().raw('navigation', 'primary')).toBeUndefined()
  })
})

describe('saveFooterNavAction', () => {
  it('saves the footer and revalidates the root layout', async () => {
    const footer = { tagline: 'Hi', columns: [{ id: 'c', heading: 'Explore', links: [link] }], bottomLinks: [] }
    expect(await saveFooterNavAction(footer)).toEqual({ ok: true })
    expect(getMockDb().raw('navigation', 'footer')).toMatchObject({ tagline: 'Hi', updatedBy: 'editor-1' })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('rejects an over-long tagline', async () => {
    const res = await saveFooterNavAction({ tagline: 'x'.repeat(281), columns: [], bottomLinks: [] })
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining('tagline') })
  })
})
