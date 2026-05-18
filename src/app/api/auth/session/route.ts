import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clearSession, mintSessionCookie } from '@/lib/auth/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

const PostBody = z.object({ idToken: z.string().min(10) })

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  const parsed = PostBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'idToken required' }, { status: 400 })
  }
  const decoded = await adminAuth()
    .verifyIdToken(parsed.data.idToken)
    .catch(() => null)
  if (!decoded) {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }
  const editorDoc = await adminDb().doc(`editors/${decoded.uid}`).get()
  if (!editorDoc.exists) {
    return NextResponse.json(
      { error: 'this Google account is not an authorized editor' },
      { status: 403 },
    )
  }
  await mintSessionCookie(parsed.data.idToken)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await clearSession()
  return NextResponse.json({ ok: true })
}
