import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'

vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

import type { PhotoInput } from '@/lib/content-schema'
import {
  listPhotos,
  getPhotoById,
  listPhotosByProject,
  listFeaturedPhotos,
  createPhoto,
  updatePhoto,
  deletePhoto,
  swapPhotoOrder,
} from '@/lib/cms/photosAdmin'
import { resetFirebaseAdminMock, getMockDb } from '@/test/firebaseAdminMock'

const COL = 'photos'

const input = (over: Partial<PhotoInput> = {}): PhotoInput => ({
  filename: 'porch.jpg',
  storagePath: 'photos/porch.jpg',
  downloadUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/photos%2Fporch.jpg',
  caption: 'Front porch',
  altText: 'The front porch of the Main House',
  project: 'main-house',
  category: 'exterior',
  featured: false,
  order: -1,
  dateTaken: '',
  ...over,
})

const raw = async (id: string) => getMockDb().raw(COL, id)

beforeEach(() => resetFirebaseAdminMock())

describe('createPhoto', () => {
  it('appends after the highest existing order when order is negative', async () => {
    getMockDb().seed(COL, 'a', { order: 4 })
    getMockDb().seed(COL, 'b', { order: 9 })
    const id = await createPhoto(input(), 'editor-1')
    expect(await raw(id)).toMatchObject({ order: 10, createdBy: 'editor-1', updatedBy: 'editor-1' })
  })

  it('starts at 0 in an empty library', async () => {
    const id = await createPhoto(input(), 'editor-1')
    expect((await raw(id))?.order).toBe(0)
  })

  it('keeps an explicit order and stores dateTaken as a Timestamp', async () => {
    const id = await createPhoto(input({ order: 3, dateTaken: '1924-06-01' }), 'editor-1')
    const doc = await raw(id)
    expect(doc?.order).toBe(3)
    expect(doc?.dateTaken).toBeInstanceOf(Timestamp)
  })
})

describe('reads', () => {
  beforeEach(() => {
    getMockDb().seed(COL, 'p1', { ...input(), order: 2, featured: true, dateTaken: null })
    getMockDb().seed(COL, 'p2', { ...input({ project: 'onion-barn' }), order: 1 })
    getMockDb().seed(COL, 'p3', { ...input(), order: 0 })
  })

  it('lists every photo by order', async () => {
    expect((await listPhotos()).map((p) => p.id)).toEqual(['p3', 'p2', 'p1'])
  })

  it('filters by project and by featured', async () => {
    expect((await listPhotosByProject('main-house')).map((p) => p.id)).toEqual(['p3', 'p1'])
    expect((await listFeaturedPhotos()).map((p) => p.id)).toEqual(['p1'])
  })

  it('returns a serialisable record, or null when missing', async () => {
    expect(await getPhotoById('p1')).toMatchObject({ id: 'p1', dateTaken: '', project: 'main-house' })
    expect(await getPhotoById('nope')).toBeNull()
  })
})

describe('updatePhoto', () => {
  it('overwrites fields and stamps the editor', async () => {
    getMockDb().seed(COL, 'p1', { ...input(), order: 0 })
    await updatePhoto('p1', input({ caption: 'New caption', order: 0 }), 'editor-2')
    expect(await raw('p1')).toMatchObject({ caption: 'New caption', updatedBy: 'editor-2' })
  })
})

describe('deletePhoto', () => {
  it('removes the doc and returns its own storagePath', async () => {
    getMockDb().seed(COL, 'p1', { ...input({ storagePath: 'photos/p1.jpg' }) })
    expect(await deletePhoto('p1')).toBe('photos/p1.jpg')
    expect(await raw('p1')).toBeUndefined()
  })

  it('returns null for a missing doc or one with no storagePath', async () => {
    expect(await deletePhoto('nope')).toBeNull()
    getMockDb().seed(COL, 'p2', { ...input({ storagePath: '' }) })
    expect(await deletePhoto('p2')).toBeNull()
  })
})

describe('swapPhotoOrder', () => {
  it('swaps the two orders', async () => {
    getMockDb().seed(COL, 'a', { order: 1 })
    getMockDb().seed(COL, 'b', { order: 5 })
    await swapPhotoOrder('a', 'b', 'editor-1')
    expect((await raw('a'))?.order).toBe(5)
    expect((await raw('b'))?.order).toBe(1)
  })

  it('does nothing when either photo is missing', async () => {
    getMockDb().seed(COL, 'a', { order: 1 })
    await swapPhotoOrder('a', 'gone', 'editor-1')
    expect((await raw('a'))?.order).toBe(1)
  })
})

describe('when Firestore fails (e.g. a missing composite index)', () => {
  it('serves empty/null fallbacks and logs each one (MCA-32)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(getMockDb(), 'collection').mockImplementation(() => {
      throw Object.assign(new Error('The query requires an index.'), { code: 9 })
    })
    expect(await listPhotos()).toEqual([])
    expect(await getPhotoById('x')).toBeNull()
    expect(await listPhotosByProject('main-house')).toEqual([])
    expect(await listFeaturedPhotos()).toEqual([])
    const logs = warn.mock.calls.map((c) => JSON.parse(c[0] as string))
    expect(logs.map((l) => l.scope)).toEqual([
      'photos.list',
      'photos.getById',
      'photos.listByProject',
      'photos.listFeatured',
    ])
    expect(logs[2]).toMatchObject({ slug: 'main-house', error: 'The query requires an index. [9]' })
    vi.restoreAllMocks()
  })
})
