import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

// MCA-149: execute storage.rules on the emulator. isEditor() in the Storage
// rules reads Firestore (cross-service), so both emulators run and the
// editors allowlist is seeded in Firestore.

const EDITOR = 'editor-uid'
const STRANGER = 'signed-in-non-editor'
const TEN_MB = 10 * 1024 * 1024
let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mcarthur',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  })
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`editors/${EDITOR}`).set({ email: 'e@x.org' })
  })
})

afterAll(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearStorage()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.storage().ref('pages/seed/existing.jpg').put(new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' })
    await ctx.storage().ref('private/x.txt').put(new Uint8Array([1]), { contentType: 'text/plain' })
  })
})

const storageFor = (uid?: string) =>
  (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).storage()
const image = (bytes = 16) => new Uint8Array(bytes)
// UploadTask is thenable but not a Promise; assertSucceeds/Fails want a Promise.
const put = (uid: string | undefined, path: string, data: Uint8Array, contentType: string) =>
  Promise.resolve(storageFor(uid).ref(path).put(data, { contentType }))

describe.each(['pages', 'content', 'photos'])('%s/** (editor uploads)', (root) => {
  it('editors can upload an image under 10 MB', async () => {
    await assertSucceeds(put(EDITOR, `${root}/a/pic.jpg`, image(), 'image/jpeg'))
  })

  it('rejects non-image uploads, even from editors', async () => {
    await assertFails(put(EDITOR, `${root}/a/doc.pdf`, image(), 'application/pdf'))
  })

  it('rejects files of 10 MB or more', async () => {
    await assertFails(put(EDITOR, `${root}/a/huge.jpg`, new Uint8Array(TEN_MB), 'image/jpeg'))
  })

  it('rejects uploads from visitors and signed-in non-editors', async () => {
    await assertFails(put(undefined, `${root}/a/pic.jpg`, image(), 'image/jpeg'))
    await assertFails(put(STRANGER, `${root}/a/pic.jpg`, image(), 'image/jpeg'))
  })
})

describe('reads', () => {
  it('site images are public', async () => {
    await assertSucceeds(storageFor().ref('pages/seed/existing.jpg').getMetadata())
  })

  it('anything outside the known folders is closed (default deny)', async () => {
    await assertFails(storageFor().ref('private/x.txt').getMetadata())
    await assertFails(storageFor(EDITOR).ref('private/x.txt').getMetadata())
    await assertFails(put(EDITOR, 'private/y.jpg', image(), 'image/jpeg'))
  })
})
