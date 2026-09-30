import { describe, it, expect, beforeEach, vi } from 'vitest'

// MCA-114: browser sign-in glue. Firebase Auth and fetch are mocked.
const signInWithPopup = vi.fn()
const fbSignOut = vi.fn()
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {},
  signInWithPopup: (...a: unknown[]) => signInWithPopup(...a),
  signOut: (...a: unknown[]) => fbSignOut(...a),
}))
vi.mock('@/lib/firebase', () => ({ auth: { name: 'test-auth' } }))

import { signInWithGoogle, signOut } from './client'

const fetchMock = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  signInWithPopup.mockResolvedValue({ user: { getIdToken: async () => 'id-token' } })
})

describe('signInWithGoogle', () => {
  it('exchanges the Google ID token for a session cookie', async () => {
    fetchMock.mockResolvedValue({ ok: true })
    await signInWithGoogle()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ idToken: 'id-token' }),
    }))
    expect(fbSignOut).not.toHaveBeenCalled()
  })

  it('signs the client back out and surfaces the server error when refused', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'not an authorized editor' }) })
    await expect(signInWithGoogle()).rejects.toThrow('not an authorized editor')
    expect(fbSignOut).toHaveBeenCalled()
  })

  it('falls back to a generic message when the error body is unreadable', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => { throw new Error('not json') } })
    await expect(signInWithGoogle()).rejects.toThrow('sign-in failed')
  })
})

describe('signOut', () => {
  it('clears the server session, then the client', async () => {
    fetchMock.mockResolvedValue({ ok: true })
    await signOut()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/session', { method: 'DELETE' })
    expect(fbSignOut).toHaveBeenCalled()
  })
})
