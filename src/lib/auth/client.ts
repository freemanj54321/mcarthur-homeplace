'use client'

import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const provider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<void> {
  const result = await signInWithPopup(auth, provider)
  const idToken = await result.user.getIdToken()
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) {
    await fbSignOut(auth)
    const body = await res.json().catch(() => ({ error: 'sign-in failed' }))
    throw new Error(body.error ?? 'sign-in failed')
  }
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' })
  await fbSignOut(auth)
}
