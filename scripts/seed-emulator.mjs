/**
 * Seed the Firebase Emulator Suite with the minimum fixture data the WS2
 * (MCA-20) E2E suite needs:
 *
 *   - an editor (Auth user + editors/{uid} allowlist doc)
 *   - a published page (renders publicly at /<slug>)
 *   - a draft page (must 404 publicly)
 *   - a published project (drives the "What to See" dynamic nav dropdown)
 *
 *   - two published milestones (the structured-reorder test swaps them)
 *
 * Status: DONE (MCA-148). Photos and navigation are cleared, not seeded: the
 * upload and nav-edit tests create their own and every run starts clean.
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
  // Link a Google identity so the Auth emulator's sign-in popup lists this
  // account: E2E signs in through the real "Continue with Google" button
  // (signInWithPopup), which also signs in the client SDK that Storage uploads
  // need. Idempotent: linking the same provider uid again is a no-op.
  await auth.updateUser(EDITOR.uid, {
    providerToLink: {
      providerId: 'google.com',
      uid: `google-${EDITOR.uid}`,
      email: EDITOR.email,
      displayName: EDITOR.displayName,
    },
  })
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
// Every ProjectInput field is present: the public reader validates published
// docs against the schema, so a partial doc would 404 on its detail page.
const PUBLISHED_PROJECT = {
  slug: 'e2e-project',
  title: 'E2E Project',
  subtitle: 'A published project for the What-to-See dropdown.',
  kind: 'Outbuilding',
  built: 'c. 1900',
  architect: '',
  style: '',
  materials: '',
  footprint: '',
  placeholder: 'E2E Project',
  excerpt: 'Seeded by the E2E harness.',
  description: 'Seeded by the E2E harness.',
  features: [],
  cardImage: null,
  heroImages: [],
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

// ── Milestones (the structured-reorder test swaps these two) ─────────────────
const MILESTONES = [
  { year: '1893', title: 'E2E Milestone First', body: 'Seeded by the E2E harness.' },
  { year: '1900', title: 'E2E Milestone Second', body: 'Seeded by the E2E harness.' },
]

async function seedMilestones() {
  await Promise.all(
    MILESTONES.map((m, order) =>
      db.collection('milestones').add({
        ...m,
        order,
        status: 'published',
        publishedSnapshot: { ...m },
        publishedAt: now(),
        createdBy: 'seed-emulator',
        createdAt: now(),
        updatedBy: 'seed-emulator',
        updatedAt: now(),
      }),
    ),
  )
}

// ── Run ───────────────────────────────────────────────────────────────────────
await Promise.all(
  ['pages', 'projects', 'editors', 'milestones', 'photos', 'navigation'].map(clearCollection),
)

await seedEditor()
await seedPage(PUBLISHED_PAGE)
await seedPage(DRAFT_PAGE)
await seedProject(PUBLISHED_PROJECT)
await seedMilestones()

console.log('Emulator seed complete:')
console.log(`  editor:           ${EDITOR.email} (${EDITOR.uid})`)
console.log(`  published page:   /${PUBLISHED_PAGE.slug}`)
console.log(`  draft page:       /${DRAFT_PAGE.slug} (should 404)`)
console.log(`  published project: ${PUBLISHED_PROJECT.title} (${PUBLISHED_PROJECT.slug})`)
console.log(`  milestones:       ${MILESTONES.map((m) => m.title).join(', ')}`)
process.exit(0)
