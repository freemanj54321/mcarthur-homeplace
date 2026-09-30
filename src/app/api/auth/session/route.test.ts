import { describe, it, expect, beforeEach, vi } from 'vitest'

// MCA-114: POST mints the session cookie, DELETE clears it.
vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

const jar = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}))

import { POST, DELETE } from './route'
import { resetFirebaseAdminMock, getMockAuth, mockEditor } from '@/test/firebaseAdminMock'

const post = (body: unknown) =>
  POST(new Request('https://example.org/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }))

const nowSeconds = () => Math.floor(Date.now() / 1000)

beforeEach(() => {
  resetFirebaseAdminMock()
  jar.clear()
})

describe('POST /api/auth/session', () => {
  it('400s on malformed JSON or a missing token', async () => {
    expect((await post('{nope')).status).toBe(400)
    expect((await post({})).status).toBe(400)
  })

  it('401s on an invalid ID token', async () => {
    getMockAuth().verifyIdToken.mockRejectedValue(new Error('auth/argument-error'))
    expect((await post({ idToken: 'forged-token-xyz' })).status).toBe(401)
    expect(jar.has('__session')).toBe(false)
  })

  it('401s when the sign-in is older than the allowed window', async () => {
    mockEditor({ uid: 'u1', email: 'a@b.org' })
    getMockAuth().verifyIdToken.mockResolvedValue({ uid: 'u1', auth_time: nowSeconds() - 3600 })
    const res = await post({ idToken: 'old-but-valid-token' })
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('sign in again') })
    expect(getMockAuth().createSessionCookie).not.toHaveBeenCalled()
  })

  it('403s for a valid, fresh sign-in by someone not on the allowlist', async () => {
    getMockAuth().verifyIdToken.mockResolvedValue({ uid: 'stranger', auth_time: nowSeconds() })
    expect((await post({ idToken: 'fresh-token-1234' })).status).toBe(403)
    expect(jar.has('__session')).toBe(false)
  })

  it('mints the session cookie for a fresh sign-in by an editor', async () => {
    mockEditor({ uid: 'u1', email: 'a@b.org' })
    getMockAuth().verifyIdToken.mockResolvedValue({ uid: 'u1', auth_time: nowSeconds() })
    const res = await post({ idToken: 'fresh-token-1234' })
    expect(res.status).toBe(200)
    expect(jar.get('__session')).toBe('session-cookie')
  })
})

describe('DELETE /api/auth/session', () => {
  it('clears the cookie', async () => {
    jar.set('__session', 'good')
    getMockAuth().verifySessionCookie.mockResolvedValue({ uid: 'u1', sub: 'u1' })
    expect((await DELETE()).status).toBe(200)
    expect(jar.has('__session')).toBe(false)
  })
})
