import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

// MCA-149: execute firestore.rules on the emulator (the existing guards only
// read the file as text). Run via `npm run test:rules`, which starts the
// emulators. Admin SDK writes bypass rules; these guard direct client access.

const EDITOR = 'editor-uid'
const STRANGER = 'signed-in-non-editor'
let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mcarthur',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await db.doc(`editors/${EDITOR}`).set({ email: 'e@x.org' })
    for (const col of ['pages', 'projects', 'news', 'events', 'milestones', 'boardMembers', 'partners']) {
      await db.doc(`${col}/pub`).set({ slug: 'pub', status: 'published' })
      await db.doc(`${col}/draft`).set({ slug: 'draft', status: 'draft' })
    }
    await db.doc('photos/p1').set({ caption: 'c' })
    await db.doc('navigation/primary').set({ utility: [] })
    await db.doc('secrets/x').set({ v: 1 })
  })
})

const anon = () => env.unauthenticatedContext().firestore()
const stranger = () => env.authenticatedContext(STRANGER).firestore()
const editor = () => env.authenticatedContext(EDITOR).firestore()

describe.each(['pages', 'projects', 'news', 'events', 'milestones', 'boardMembers', 'partners'])(
  '%s (publish model)',
  (col) => {
    it('anyone can read published docs', async () => {
      await assertSucceeds(anon().doc(`${col}/pub`).get())
    })

    it('drafts are hidden from visitors and non-editors', async () => {
      await assertFails(anon().doc(`${col}/draft`).get())
      await assertFails(stranger().doc(`${col}/draft`).get())
    })

    it('a public list must be limited to published docs', async () => {
      await assertSucceeds(anon().collection(col).where('status', '==', 'published').get())
      await assertFails(anon().collection(col).get())
    })

    it('editors can read drafts and write', async () => {
      await assertSucceeds(editor().doc(`${col}/draft`).get())
      await assertSucceeds(editor().doc(`${col}/new`).set({ slug: 'n', status: 'draft' }))
    })

    it('visitors and non-editors cannot write', async () => {
      await assertFails(anon().doc(`${col}/new`).set({ status: 'published' }))
      await assertFails(stranger().doc(`${col}/pub`).update({ status: 'draft' }))
      await assertFails(stranger().doc(`${col}/pub`).delete())
    })
  },
)

describe('photos', () => {
  it('are publicly readable', async () => {
    await assertSucceeds(anon().doc('photos/p1').get())
  })

  it('only editors can write', async () => {
    await assertSucceeds(editor().doc('photos/p2').set({ caption: 'x' }))
    await assertFails(anon().doc('photos/p2').set({ caption: 'x' }))
    await assertFails(stranger().doc('photos/p1').delete())
  })
})

describe('navigation', () => {
  it('is publicly readable and editor-writable only', async () => {
    await assertSucceeds(anon().doc('navigation/primary').get())
    await assertSucceeds(editor().doc('navigation/primary').set({ utility: [] }))
    await assertFails(stranger().doc('navigation/primary').set({ utility: [] }))
  })
})

describe('editors allowlist', () => {
  it('a signed-in user can read only their own entry', async () => {
    await assertSucceeds(editor().doc(`editors/${EDITOR}`).get())
    await assertFails(stranger().doc(`editors/${EDITOR}`).get())
    await assertFails(anon().doc(`editors/${EDITOR}`).get())
  })

  it('nobody can write it from a client, not even an editor (grants go through the Admin SDK)', async () => {
    await assertFails(stranger().doc(`editors/${STRANGER}`).set({ email: 'me@x.org' }))
    await assertFails(editor().doc(`editors/${STRANGER}`).set({ email: 'x@x.org' }))
  })
})

describe('default deny', () => {
  it('unknown collections are closed to everyone', async () => {
    await assertFails(anon().doc('secrets/x').get())
    await assertFails(editor().doc('secrets/x').get())
    await assertFails(editor().doc('secrets/y').set({ v: 1 }))
  })
})
