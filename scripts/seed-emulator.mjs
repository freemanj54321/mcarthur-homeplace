/**
 * Seed the Firebase Emulator Suite with the minimum fixture data the WS2
 * (MCA-20) E2E suite needs:
 *
 *   - an editor (Auth user + editors/{uid} allowlist doc)
 *   - a published page (renders publicly at /<slug>)
 *   - a draft page (must 404 publicly)
 *   - a published project (drives the "What to See" dynamic nav dropdown)
 *
 * Intended to run inside `firebase emulators:exec`, which sets
 * FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST so the Admin SDK talks
 * to the emulator and needs no real credentials. Safe to re-run: it clears the
 * seeded collections first so each E2E run starts from a known state.
 */

import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    'Refusing to seed: FIRESTORE_EMULATOR_HOST is not set. Run via `npm run test:e2e` ' +
      '(firebase emulators:exec) so this only ever touches the emulator.',
  )
  process.exit(1)
}

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-mcarthur'

if (getApps().length === 0) {
  initializeApp({ projectId: PROJECT_ID })
}

const auth = getAuth()
const db = getFirestore()

// ── Editor identity ──────────────────────────────────────────────────────────
export const EDITOR = {
  uid: 'e2e-editor',
  email: 'editor@example.com',
  displayName: 'E2E Editor',
}

async function seedEditor() {
  try {
    await auth.getUser(EDITOR.uid)
  } catch {
    await auth.createUser({
      uid: EDITOR.uid,
      email: EDITOR.email,
      emailVerified: true,
      displayName: EDITOR.displayName,
    })
  }
  await db.collection('editors').doc(EDITOR.uid).set({
    email: EDITOR.email,
    displayName: EDITOR.displayName,
    addedAt: FieldValue.serverTimestamp(),
    addedBy: 'seed-emulator',
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const now = () => FieldValue.serverTimestamp()

async function clearCollection(name) {
  const snap = await db.collection(name).get()
  await Promise.all(snap.docs.map((d) => d.ref.delete()))
}

// ── Pages ─────────────────────────────────────────────────────────────────────
const PUBLISHED_PAGE = {
  slug: 'e2e-published',
  title: 'E2E Published Page',
  hero: null,
  sections: [
    {
      id: 'e2e-published-intro',
      type: 'richText',
      html: '<p class="lead">This page is published and should render publicly.</p>',
    },
  ],
  status: 'published',
}

const DRAFT_PAGE = {
  slug: 'e2e-draft',
  title: 'E2E Draft Page',
  hero: null,
  sections: [
    {
      id: 'e2e-draft-intro',
      type: 'richText',
      html: '<p>This page is a draft and must 404 for anonymous visitors.</p>',
    },
  ],
  status: 'draft',
}

async function seedPage({ slug, title, hero, sections, status }) {
  const snapshot =
    status === 'published' ? { title, hero, sections } : null
  await db.collection('pages').add({
    slug,
    title,
    hero,
    sections,
    status,
    publishedSnapshot: snapshot,
    publishedAt: status === 'published' ? now() : null,
    createdBy: 'seed-emulator',
    createdAt: now(),
    updatedBy: 'seed-emulator',
    updatedAt: now(),
  })
}

// ── Projects (drives the "What to See" dynamic nav dropdown) ──────────────────
const PUBLISHED_PROJECT = {
  slug: 'e2e-project',
  title: 'E2E Project',
  subtitle: 'A published project for the What-to-See dropdown.',
  excerpt: 'Seeded by the E2E harness.',
  description: 'Seeded by the E2E harness.',
  order: 0,
  status: 'published',
}

async function seedProject(project) {
  const { status, ...rest } = project
  await db.collection('projects').add({
    ...rest,
    status,
    publishedSnapshot: { ...rest },
    publishedAt: now(),
    createdBy: 'seed-emulator',
    createdAt: now(),
    updatedBy: 'seed-emulator',
    updatedAt: now(),
  })
}

// ── Run ───────────────────────────────────────────────────────────────────────
await Promise.all([
  clearCollection('pages'),
  clearCollection('projects'),
  clearCollection('editors'),
])

await seedEditor()
await seedPage(PUBLISHED_PAGE)
await seedPage(DRAFT_PAGE)
await seedProject(PUBLISHED_PROJECT)

console.log('Emulator seed complete:')
console.log(`  editor:           ${EDITOR.email} (${EDITOR.uid})`)
console.log(`  published page:   /${PUBLISHED_PAGE.slug}`)
console.log(`  draft page:       /${DRAFT_PAGE.slug} (should 404)`)
console.log(`  published project: ${PUBLISHED_PROJECT.title} (${PUBLISHED_PROJECT.slug})`)
process.exit(0)
