import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

const COOKIE = '__session'
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000

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

export async function getCurrentEditor(): Promise<Editor | null> {
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
}

export async function requireEditor(): Promise<Editor> {
  const editor = await getCurrentEditor()
  if (!editor) redirect('/admin/login')
  return editor
}
