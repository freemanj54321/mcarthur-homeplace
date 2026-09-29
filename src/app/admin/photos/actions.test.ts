import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/server', () => ({
  requireEditor: vi.fn(async () => ({ uid: 'editor-1', email: null, displayName: null })),
}))

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import { savePhotoAction, deletePhotoAction, reorderPhotoAction } from './actions'
import { resetFirebaseAdminMock, getMockDb, adminStorage } from '@/test/firebaseAdminMock'

const COL = 'photos'
const PUBLIC_PATHS = [['/admin/photos'], ['/what-to-see', 'layout'], ['/']]

const valid = {
  filename: 'porch.jpg',
  storagePath: 'photos/porch.jpg',
  downloadUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/photos%2Fporch.jpg',
  caption: '',
  altText: '',
  project: null,
  category: 'archival',
  featured: false,
  order: -1,
  dateTaken: '',
}

/** Make bucket().file(path) return a stub whose delete() resolves (or rejects). */
function stubFileDelete(impl: () => Promise<unknown> = async () => undefined) {
  const del = vi.fn(impl)
  vi.mocked(adminStorage().bucket().file).mockReturnValue({ delete: del } as never)
  return del
}

beforeEach(() => {
  resetFirebaseAdminMock()
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(requireEditor).mockClear()
})

describe('savePhotoAction', () => {
  it('creates a photo and revalidates the public pages', async () => {
    const res = await savePhotoAction(null, valid)
    expect(res.ok).toBe(true)
    if (res.ok) expect(getMockDb().raw(COL, res.id)).toMatchObject({ createdBy: 'editor-1' })
    expect(vi.mocked(revalidatePath).mock.calls).toEqual(PUBLIC_PATHS)
  })

  it('returns field errors instead of throwing on invalid input', async () => {
    const res = await savePhotoAction(null, { ...valid, category: 'selfie' })
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining('category') })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('requires an editor before writing', async () => {
    vi.mocked(requireEditor).mockRejectedValueOnce(new Error('NEXT_REDIRECT'))
    await expect(savePhotoAction(null, valid)).rejects.toThrow('NEXT_REDIRECT')
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('deletePhotoAction', () => {
  it("deletes the Storage object at the doc's own path (MCA-113)", async () => {
    getMockDb().seed(COL, 'p1', { ...valid, storagePath: 'photos/p1.jpg' })
    const del = stubFileDelete()
    expect(await deletePhotoAction('p1')).toEqual({ ok: true })
    expect(adminStorage().bucket().file).toHaveBeenCalledWith('photos/p1.jpg')
    expect(del).toHaveBeenCalledOnce()
    expect(getMockDb().raw(COL, 'p1')).toBeUndefined()
    expect(vi.mocked(revalidatePath).mock.calls).toEqual(PUBLIC_PATHS)
  })

  it('ignores any extra path argument a tampered client sends', async () => {
    getMockDb().seed(COL, 'p1', { ...valid, storagePath: 'photos/p1.jpg' })
    stubFileDelete()
    // Old signature was (id, storagePath); a stale or malicious caller may still pass one.
    await (deletePhotoAction as (...a: unknown[]) => Promise<unknown>)('p1', 'pages/home/hero.jpg')
    expect(adminStorage().bucket().file).toHaveBeenCalledWith('photos/p1.jpg')
    expect(adminStorage().bucket().file).not.toHaveBeenCalledWith('pages/home/hero.jpg')
  })

  it('touches no Storage object when the doc is missing', async () => {
    stubFileDelete()
    expect(await deletePhotoAction('gone')).toEqual({ ok: true })
    expect(adminStorage().bucket().file).not.toHaveBeenCalled()
  })

  it('still succeeds when the Storage object is already gone', async () => {
    getMockDb().seed(COL, 'p1', { ...valid })
    stubFileDelete(async () => {
      throw new Error('No such object')
    })
    expect(await deletePhotoAction('p1')).toEqual({ ok: true })
    expect(getMockDb().raw(COL, 'p1')).toBeUndefined()
  })
})

describe('reorderPhotoAction', () => {
  it('swaps order and revalidates the public galleries too', async () => {
    getMockDb().seed(COL, 'a', { order: 0 })
    getMockDb().seed(COL, 'b', { order: 1 })
    expect(await reorderPhotoAction('a', 'b')).toEqual({ ok: true })
    expect(getMockDb().raw(COL, 'a')?.order).toBe(1)
    expect(vi.mocked(revalidatePath).mock.calls).toEqual(PUBLIC_PATHS)
  })
})
