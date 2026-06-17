// Centralized firebase-admin mock — mirrors the real module's exports
// (adminAuth, adminDb, adminStorage) backed by an in-memory Firestore and
// vi.fn() auth stubs. This is the shared seam for WS1 lib/action tests so they
// run with no live Firebase project. See WS0 (MCA-18).
//
// Usage in a test file:
//
//   import { vi, beforeEach } from 'vitest'
//   vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))
//   import { resetFirebaseAdminMock, getMockDb, mockEditor } from '@/test/firebaseAdminMock'
//
//   beforeEach(() => resetFirebaseAdminMock())
//
// FieldValue/Timestamp are imported directly from 'firebase-admin/firestore' by
// the code under test (real, app-less, safe) — they are not mocked here.
import { vi } from 'vitest'
import { createFakeFirestore, FakeFirestore, type DocData } from './firestoreMock'

let db = createFakeFirestore()

const auth = {
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
  verifyIdToken: vi.fn(),
}

const bucket = {
  file: vi.fn(),
  upload: vi.fn(),
}
const storage = {
  bucket: vi.fn(() => bucket),
}

/** Reset the in-memory db and all auth stubs to defaults. Call in beforeEach. */
export function resetFirebaseAdminMock(seed?: Record<string, Record<string, DocData>>): void {
  db = createFakeFirestore(seed)
  auth.createSessionCookie.mockReset().mockResolvedValue('session-cookie')
  auth.verifySessionCookie.mockReset()
  auth.revokeRefreshTokens.mockReset().mockResolvedValue(undefined)
  auth.verifyIdToken.mockReset()
  bucket.file.mockReset()
  bucket.upload.mockReset()
  storage.bucket.mockReset().mockReturnValue(bucket)
}

/** The current in-memory Firestore — seed docs / assert raw writes against it. */
export function getMockDb(): FakeFirestore {
  return db
}

/** The auth stubs — configure return values or assert calls. */
export function getMockAuth(): typeof auth {
  return auth
}

/**
 * Make a user a valid, allowlisted editor: verifySessionCookie/verifyIdToken
 * resolve to a decoded token, and an editors/{uid} doc exists.
 */
export function mockEditor(editor: {
  uid: string
  email?: string | null
  displayName?: string | null
}): void {
  const decoded = {
    uid: editor.uid,
    sub: editor.uid,
    email: editor.email ?? null,
    name: editor.displayName ?? null,
  }
  auth.verifySessionCookie.mockResolvedValue(decoded)
  auth.verifyIdToken.mockResolvedValue(decoded)
  db.seed('editors', editor.uid, { email: editor.email ?? null })
}

export const adminAuth = () => auth
export const adminDb = () => db
export const adminStorage = () => storage
