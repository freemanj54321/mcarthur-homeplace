import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

const COOKIE = '__session'
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000
/**
 * A session cookie may only be minted from a fresh sign-in (Firebase's
 * session-cookie guidance), so a leaked older ID token can't be upgraded into
 * a 5-day cookie (MCA-114).
 */
export const MAX_SIGN_IN_AGE_SECONDS = 5 * 60

/** True when the ID token's `auth_time` (seconds) is within the allowed age. */
export function isRecentSignIn(authTimeSeconds: number | undefined, nowMs = Date.now()): boolean {
  if (typeof authTimeSeconds !== 'number') return false
  return nowMs / 1000 - authTimeSeconds <= MAX_SIGN_IN_AGE_SECONDS
}

export type Editor = {
  uid: string
  email: string | null
  displayName: string | null
}

export async function mintSessionCookie(idToken: string): Promise<void> {
  const sessionCookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: FIVE_DAYS_MS,
  })
  const jar = await cookies()
  jar.set(COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: FIVE_DAYS_MS / 1000,
  })
}

export async function clearSession(): Promise<void> {
  const jar = await cookies()
  const existing = jar.get(COOKIE)?.value
  jar.delete(COOKIE)
  if (existing) {
    try {
      const decoded = await adminAuth().verifySessionCookie(existing)
      await adminAuth().revokeRefreshTokens(decoded.sub)
    } catch {
      // already invalid; nothing to revoke
    }
  }
}

/**
 * The signed-in editor, or null. Wrapped in React `cache()` so the admin layout
 * and the page's requireEditor() share one check per request, instead of two
 * revocation lookups plus two Firestore reads (MCA-114).
 */
export const getCurrentEditor = cache(async (): Promise<Editor | null> => {
  const jar = await cookies()
  const cookie = jar.get(COOKIE)?.value
  if (!cookie) return null
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true)
    const editorDoc = await adminDb().doc(`editors/${decoded.uid}`).get()
    if (!editorDoc.exists) return null
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: (decoded.name as string | undefined) ?? null,
    }
  } catch {
    return null
  }
})

export async function requireEditor(): Promise<Editor> {
  const editor = await getCurrentEditor()
  if (!editor) redirect('/admin/login')
  return editor
}
