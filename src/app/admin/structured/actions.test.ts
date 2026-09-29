import { describe, it, expect, beforeEach, vi } from 'vitest'

// MCA-115: the generic structured actions + registry, run against the real
// stores over the in-memory Firestore. Safety net for MCA-30 (registry types).
vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/server', () => ({
  requireEditor: vi.fn(async () => ({ uid: 'editor-1', email: null, displayName: null })),
}))

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import {
  saveStructuredAction,
  publishStructuredAction,
  unpublishStructuredAction,
  deleteStructuredAction,
  reorderStructuredAction,
} from './actions'
import { REGISTRY, getEntry } from './registry'
import { COLLECTION_KEYS } from '@/lib/content-schema'
import { resetFirebaseAdminMock, getMockDb } from '@/test/firebaseAdminMock'

const partner = (name: string) => ({ name, url: '' })
const calls = () => vi.mocked(revalidatePath).mock.calls

async function createPartner(name: string): Promise<string> {
  const res = await saveStructuredAction('partners', null, partner(name))
  if (!res.ok) throw new Error(res.error)
  return res.id
}

beforeEach(() => {
  resetFirebaseAdminMock()
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(requireEditor).mockClear()
})

describe('registry', () => {
  it('has an entry for exactly the collections the admin forms describe', () => {
    expect(Object.keys(REGISTRY).sort()).toEqual([...COLLECTION_KEYS].sort())
  })

  it('returns null for an unknown collection', () => {
    expect(getEntry('editors')).toBeNull()
  })

  it('revalidates the root layout for projects (they feed the nav dropdown)', () => {
    expect(getEntry('projects')?.layout).toBe(true)
  })
})

describe('saveStructuredAction', () => {
  it('creates a draft and revalidates the admin list plus the public paths', async () => {
    const id = await createPartner('Historical Society')
    expect(getMockDb().raw('partners', id)).toMatchObject({ name: 'Historical Society', status: 'draft' })
    expect(calls()).toEqual([['/admin/structured/partners'], ['/about']])
  })

  it('updates in place', async () => {
    const id = await createPartner('A')
    const res = await saveStructuredAction('partners', id, partner('B'))
    expect(res).toEqual({ ok: true, id })
    expect(getMockDb().raw('partners', id)?.name).toBe('B')
  })

  it('revalidates the root layout when a project changes', async () => {
    const project = {
      slug: 'onion-barn', title: 'The Onion Barn', subtitle: '', kind: '', built: '',
      architect: '', style: '', materials: '', footprint: '', placeholder: '',
      excerpt: '', description: '', features: [], cardImage: null, heroImages: [],
    }
    expect((await saveStructuredAction('projects', null, project)).ok).toBe(true)
    expect(calls()).toContainEqual(['/', 'layout'])
  })

  it('returns field errors, and rejects unknown collections', async () => {
    expect(await saveStructuredAction('partners', null, { name: '' })).toMatchObject({
      ok: false,
      error: expect.stringContaining('name'),
    })
    expect(await saveStructuredAction('editors', null, {})).toEqual({
      ok: false,
      error: 'Unknown collection "editors"',
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('checks the editor before anything else', async () => {
    vi.mocked(requireEditor).mockRejectedValueOnce(new Error('NEXT_REDIRECT'))
    await expect(saveStructuredAction('partners', null, partner('A'))).rejects.toThrow()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('publish / unpublish / delete / reorder', () => {
  it('moves a record through its lifecycle', async () => {
    const id = await createPartner('A')
    expect(await publishStructuredAction('partners', id)).toEqual({ ok: true })
    expect(getMockDb().raw('partners', id)?.status).toBe('published')
    expect(await unpublishStructuredAction('partners', id)).toEqual({ ok: true })
    expect(getMockDb().raw('partners', id)?.status).toBe('draft')
    expect(await deleteStructuredAction('partners', id)).toEqual({ ok: true })
    expect(getMockDb().raw('partners', id)).toBeUndefined()
  })

  it('reorders within the collection', async () => {
    const a = await createPartner('A')
    const b = await createPartner('B')
    expect(await reorderStructuredAction('partners', b, 'up')).toEqual({ ok: true })
    expect(getMockDb().raw('partners', b)?.order).toBeLessThan(getMockDb().raw('partners', a)?.order as number)
  })

  it('surfaces store errors as { ok: false }', async () => {
    const res = await publishStructuredAction('partners', 'missing')
    expect(res.ok).toBe(false)
  })

  it.each(['publish', 'unpublish', 'delete', 'reorder'] as const)(
    '%s rejects an unknown collection',
    async (op) => {
      const run = {
        publish: () => publishStructuredAction('nope', 'x'),
        unpublish: () => unpublishStructuredAction('nope', 'x'),
        delete: () => deleteStructuredAction('nope', 'x'),
        reorder: () => reorderStructuredAction('nope', 'x', 'up'),
      }[op]
      expect(await run()).toEqual({ ok: false, error: 'Unknown collection "nope"' })
    },
  )
})
