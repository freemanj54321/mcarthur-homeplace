import { describe, it, expect, beforeEach, vi } from 'vitest'

// MCA-114: the admin security boundary. Runs against the shared firebase-admin
// mock; the cookie jar and redirect are mocked at the Next.js boundary.
vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

const jar = new Map<string, string>()
const cookieStore = {
  get: vi.fn((name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined)),
  set: vi.fn((name: string, value: string) => void jar.set(name, value)),
  delete: vi.fn((name: string) => void jar.delete(name)),
}
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`)
  }),
}))

import {
  getCurrentEditor,
  requireEditor,
  mintSessionCookie,
  clearSession,
  isRecentSignIn,
  MAX_SIGN_IN_AGE_SECONDS,
} from './server'
import { resetFirebaseAdminMock, getMockAuth, mockEditor } from '@/test/firebaseAdminMock'

beforeEach(() => {
  resetFirebaseAdminMock()
  jar.clear()
  vi.clearAllMocks()
})

describe('isRecentSignIn', () => {
  const now = 1_800_000_000_000
  it('accepts a sign-in within the window and rejects older or missing ones', () => {
    expect(isRecentSignIn(now / 1000 - 10, now)).toBe(true)
    expect(isRecentSignIn(now / 1000 - MAX_SIGN_IN_AGE_SECONDS, now)).toBe(true)
    expect(isRecentSignIn(now / 1000 - MAX_SIGN_IN_AGE_SECONDS - 1, now)).toBe(false)
    expect(isRecentSignIn(undefined, now)).toBe(false)
  })
})

describe('getCurrentEditor', () => {
  it('is null without a session cookie (and never calls Firebase)', async () => {
    expect(await getCurrentEditor()).toBeNull()
    expect(getMockAuth().verifySessionCookie).not.toHaveBeenCalled()
  })

  it('is null when the cookie is invalid or revoked', async () => {
    jar.set('__session', 'bad')
    getMockAuth().verifySessionCookie.mockRejectedValue(new Error('auth/session-cookie-revoked'))
    expect(await getCurrentEditor()).toBeNull()
  })

  it('checks revocation, not just the signature', async () => {
    mockEditor({ uid: 'u1', email: 'a@b.org', displayName: 'A' })
    jar.set('__session', 'good')
    await getCurrentEditor()
    expect(getMockAuth().verifySessionCookie).toHaveBeenCalledWith('good', true)
  })

  it('is null for a valid session whose user is not on the editor allowlist', async () => {
    jar.set('__session', 'good')
    getMockAuth().verifySessionCookie.mockResolvedValue({ uid: 'stranger', sub: 'stranger' })
    expect(await getCurrentEditor()).toBeNull()
  })

  it('returns the editor for a valid session on the allowlist', async () => {
    mockEditor({ uid: 'u1', email: 'a@b.org', displayName: 'Ann' })
    jar.set('__session', 'good')
    expect(await getCurrentEditor()).toEqual({ uid: 'u1', email: 'a@b.org', displayName: 'Ann' })
  })
})

describe('requireEditor', () => {
  it('redirects to login when signed out', async () => {
    await expect(requireEditor()).rejects.toThrow('NEXT_REDIRECT:/admin/login')
  })

  it('returns the editor when signed in', async () => {
    mockEditor({ uid: 'u1', email: 'a@b.org' })
    jar.set('__session', 'good')
    await expect(requireEditor()).resolves.toMatchObject({ uid: 'u1' })
  })
})

describe('mintSessionCookie / clearSession', () => {
  it('sets an httpOnly, same-site, 5-day __session cookie', async () => {
    await mintSessionCookie('id-token')
    expect(getMockAuth().createSessionCookie).toHaveBeenCalledWith('id-token', { expiresIn: 5 * 24 * 60 * 60 * 1000 })
    expect(cookieStore.set).toHaveBeenCalledWith(
      '__session',
      'session-cookie',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 5 * 24 * 60 * 60 }),
    )
  })

  it('clears the cookie and revokes the user’s refresh tokens', async () => {
    jar.set('__session', 'good')
    getMockAuth().verifySessionCookie.mockResolvedValue({ uid: 'u1', sub: 'u1' })
    await clearSession()
    expect(cookieStore.delete).toHaveBeenCalledWith('__session')
    expect(getMockAuth().revokeRefreshTokens).toHaveBeenCalledWith('u1')
  })

  it('still clears the cookie when it is already invalid', async () => {
    jar.set('__session', 'bad')
    getMockAuth().verifySessionCookie.mockRejectedValue(new Error('expired'))
    await clearSession()
    expect(jar.has('__session')).toBe(false)
    expect(getMockAuth().revokeRefreshTokens).not.toHaveBeenCalled()
  })
})
