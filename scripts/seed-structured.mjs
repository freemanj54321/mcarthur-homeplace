/**
 * Seed the structured Firestore collections (projects, news, events,
 * milestones, boardMembers, partners) from the content that previously lived
 * in src/data/content.ts.
 *
 * Usage:
 *   SA_PATH=path/to/key.json node scripts/seed-structured.mjs
 *   # or FIREBASE_SERVICE_ACCOUNT_JSON='{...}' node scripts/seed-structured.mjs
 *
 * Idempotent: skips any collection that already has documents.
 * Each doc is written published, with a matching publishedSnapshot and an
 * `order` index preserving the original array order.
 */

import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// ── Credentials ──────────────────────────────────────────────────────────────

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  }
  if (process.env.SA_PATH) {
    return JSON.parse(readFileSync(process.env.SA_PATH, 'utf8'))
  }
  throw new Error(
    'Set FIREBASE_SERVICE_ACCOUNT_JSON (JSON string) or SA_PATH (file path) before running this script.',
  )
}

const sa = loadServiceAccount()
initializeApp({
  credential: cert({
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    privateKey: sa.private_key,
  }),
})

const db = getFirestore()

// ── Helpers ────────────────────────────────────────────────────────────────

const img = (downloadUrl, alt, caption) => ({
  storagePath: '',
  downloadUrl,
  alt,
  ...(caption ? { caption } : {}),
})

// ── Content (migrated from src/data/content.ts) ──────────────────────────────

const projects = [
  {
    slug: 'main-house',
    title: 'The Main House',
    subtitle:
      'A 350-square-foot cottage acquired in 1893, expanded by 1900 into the central-hall Queen Anne home that still stands today — listed on the National Register of Historic Places.',
    kind: 'Residence',
    built: '1893 core; expanded to present form by 1900',
    architect: 'Original structure pre-1893; additions by W.T. McArthur and his wife, 1893–1900',
    style: 'Queen Anne with central-hall plan additions',
    materials: 'Long-leaf pine cut on the property; locally-fired brick foundation piers',
    footprint:
      'Original 350 sq ft four-square (now kitchen, pantry, bath, and dining room); expanded to a central-hall plan with two rooms on each side, an east-side bedroom addition, and a large screened porch joining the two',
    placeholder: 'Main House — southwest elevation',
    excerpt:
      'Acquired by W.T. McArthur in approximately 1893 as a 350-square-foot four-square cottage, the Main House was expanded over the next seven years into the central-hall home that stands today — preserved largely unchanged for three-quarters of a century and listed on the National Register of Historic Places.',
    description:
      'The Queen Anne style home on the property was originally acquired by W.T. McArthur in approximately 1893 as a four-square, three-hundred-and-fifty-square-foot house. This original structure is what is presently the kitchen, pantry, one bath, and a dining room. W.T. and his wife moved into the house and began additions and remodeling, and by 1900 the house had reached its present state: a traditional central-hall design with two rooms on each side. An additional room was built on the east side and used as a bedroom, and a large screened porch was built to attach the new addition to the older structure. At some point — likely in the late 1920s to early 1930s — a small bathroom was added to the east side of the house.\n\nWater was originally provided by a hand-dug well, incorporated as part of the covered porch near the kitchen; the well still exists in its original location. Later, a windmill with a pump and tank was installed near the house for running water. Later still, a kerosene-powered Delco generator provided DC power with battery storage for limited lighting — at a time when only about 3% of American farms had electricity (1922). The Rural Electrification Act of 1936 brought wired power to many rural residents, and the Rural Electrification Association installed the wiring, lights, and outlets at the Historic Homeplace. The home is preserved in the same condition as it has been for the past seventy-five years, and is listed on the National Register of Historic Places.',
    features: [
      { label: 'The original 1893 core', body: 'A 350-square-foot four-square cottage — the oldest part of the house, now serving as the kitchen, pantry, bath, and dining room.' },
      { label: 'The central-hall plan', body: 'By 1900, additions had extended the house into its present central-hall layout, with two rooms on each side of the hall.' },
      { label: 'The east-side addition and screened porch', body: 'An east-side bedroom, joined to the original structure by a large screened porch — and a small east-side bathroom added in the late 1920s or early 1930s.' },
      { label: 'The hand-dug well', body: 'Originally the home’s water source, incorporated into a covered porch near the kitchen. The well still sits in its original location today.' },
    ],
    cardImage: img('/images/main-house.jpg', 'The Main House'),
    heroImages: [img('/images/main-house.jpg', 'The Main House')],
  },
  {
    slug: 'cooper-conner-house',
    title: 'The Cooper Conner House',
    subtitle: 'Lorem ipsum dolor sit amet',
    kind: 'Neighbor’s residence',
    built: 'c. 1908',
    architect: 'Built by Robert Cooper Conner, Sr.',
    style: 'Pyramidal-roof cottage, southern vernacular',
    materials: 'Sawn pine clapboard over heart-pine framing; tin roof',
    footprint: '1,180 sq ft, single-story, with a full-width front porch',
    placeholder: 'Cooper Conner House — front porch, three-quarter view',
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    features: [
      { label: 'The pyramidal roof', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.' },
      { label: 'Full-width front porch', body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.' },
      { label: 'Original sash windows', body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.' },
      { label: 'Beadboard interiors', body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.' },
    ],
    cardImage: img('/images/cooper-conner-day.jpg', 'The Cooper Conner House'),
    heroImages: [
      img('/images/cooper-conner-day.jpg', 'The Cooper Conner House — daylight', 'By day'),
      img('/images/cooper-conner-night.jpg', 'The Cooper Conner House — at night', 'By night'),
    ],
  },
  ...[
    ['onion-barn', 'The Onion Barn', 'Outbuilding', 'Onion barn — exterior, weathered'],
    ['commissary', 'The Commissary', 'Commercial building', 'Commissary — porch and steps'],
    ['tenant-housing', 'Tenant Housing', 'Tenant residence', 'Tenant house — single room with porch'],
    ['school-house', 'The School House', 'Civic building', 'Single-room schoolhouse — exterior'],
    ['long-leaf-pines', 'The Long-leaf Pines', 'Old-growth forest', 'Old-growth long-leaf pine grove'],
    ['dead-river-cemetery', 'Dead River Cemetery', 'Burial ground', 'Dead River Cemetery — marker stones'],
  ].map(([slug, title, kind, placeholder]) => ({
    slug,
    title,
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    kind,
    built: 'Lorem ipsum',
    architect: 'Lorem ipsum',
    style: 'Lorem ipsum dolor sit amet',
    materials: 'Lorem ipsum dolor sit amet',
    footprint: 'Lorem ipsum dolor sit amet',
    placeholder,
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    features: [
      { label: 'Lorem ipsum', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.' },
      { label: 'Dolor sit amet', body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.' },
      { label: 'Consectetur', body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.' },
      { label: 'Adipiscing elit', body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.' },
    ],
    cardImage: null,
    heroImages: [],
  })),
]

const news = [
  {
    slug: 'state-historical-grant-award',
    title: 'Foundation Receives State Historical Grant',
    date: '2026-04-15',
    category: 'Press Release',
    placeholder: 'Press conference at the Main House',
    excerpt: 'A $50,000 matching grant for the Main House restoration — we have until year end to match.',
    content:
      'We are thrilled to announce the State Historical Commission has awarded the foundation a $50,000 matching grant. These funds will be dedicated entirely to structural stabilization of the Main House.',
    image: null,
  },
  {
    slug: 'spring-cleanup-day-recap',
    title: 'Spring Cleanup Day, A Quiet Triumph',
    date: '2026-03-22',
    category: 'Field Notes',
    placeholder: 'Volunteers at the outbuildings, March 2026',
    excerpt: 'Forty volunteers cleared two acres of brush around the outbuildings — the foundations are visible again.',
    content:
      'Together, we cleared over two acres of overgrown brush around the outbuildings, making them accessible for the upcoming architectural surveys.',
    image: null,
  },
  {
    slug: 'oral-history-launch',
    title: 'The Porch Tapes — An Oral History Series',
    date: '2026-02-08',
    category: 'Project Update',
    placeholder: 'Field recorder on a porch swing',
    excerpt: 'Seventeen interviews recorded so far. We are sharing the first three this spring.',
    content: '',
    image: null,
  },
]

const events = [
  { title: 'Annual Heritage Day Festival', date: '2026-06-15', time: '10:00 — 16:00', location: 'The Homeplace Grounds', excerpt: 'Demonstrations, live music, and guided tours of the property.' },
  { title: 'Tracing Your Roots — A Genealogy Workshop', date: '2026-05-20', time: '14:00 — 16:00', location: 'Local Library (Partner Event)', excerpt: 'Using local archives and online tools to trace family history in the region.' },
  { title: 'Porch Reading — Voices of the Homeplace', date: '2026-07-12', time: '18:30 — 20:00', location: 'Main House Porch', excerpt: 'Selected oral history excerpts read aloud by descendants and neighbors.' },
]

const milestones = [
  { year: '1893', title: 'W.T. acquires the property', body: 'William Thomas McArthur acquires the farm and its original 350 sq ft four-square cottage.' },
  { year: '1900', title: 'The Main House reaches its present form', body: 'Additions and remodeling completed: central-hall plan, east-side bedroom, and screened porch joining old to new.' },
  { year: '1912', title: 'A working farm', body: 'Outbuildings, commissary, tenant houses, and a single-room school complete the farm in its working form.' },
  { year: '1947', title: 'The next generation', body: 'The farm passes to the second generation; tobacco and cattle dominate.' },
  { year: '1989', title: 'The end of farming', body: 'Active farming ceases. The buildings begin a long quiet.' },
  { year: '2024', title: 'The foundation is formed', body: 'Descendants and neighbors organize to preserve what remains.' },
  { year: '2026', title: 'Restoration begins', body: 'Foundation, roof, and porch work begin on the Main House.' },
]

const boardMembers = [
  { name: 'Marian McArthur Hill', role: 'President', note: 'Great-great-granddaughter of W.T.' },
  { name: 'James Cooper Conner', role: 'Vice President', note: 'Neighbor, contractor, friend' },
  { name: 'Dr. Lenora Briggs', role: 'Historian-at-large', note: 'State Historical Society' },
  { name: 'Theodore A. Whittaker', role: 'Treasurer', note: 'CPA, two-generation donor' },
  { name: 'Aurelia Park', role: 'Programs Director', note: 'Oral history & education' },
  { name: 'Beau McArthur', role: 'Secretary', note: 'Fifth-generation descendant' },
]

const partners = [
  { name: 'State Historical Commission' },
  { name: 'County Heritage Society' },
  { name: 'Long-leaf Forestry Cooperative' },
  { name: 'Old Buildings Trust' },
  { name: 'Regional Library System' },
]

// ── Seed ─────────────────────────────────────────────────────────────────────

const COLLECTIONS = [
  ['projects', projects],
  ['news', news],
  ['events', events],
  ['milestones', milestones],
  ['boardMembers', boardMembers],
  ['partners', partners],
]

for (const [name, items] of COLLECTIONS) {
  const existing = await db.collection(name).limit(1).get()
  if (!existing.empty) {
    console.log(`[skip]    ${name} — collection already has documents`)
    continue
  }

  let order = 0
  for (const fields of items) {
    const now = FieldValue.serverTimestamp()
    const ref = await db.collection(name).add({
      ...fields,
      order,
      status: 'published',
      publishedSnapshot: fields,
      publishedAt: now,
      createdBy: 'seed-structured',
      createdAt: now,
      updatedBy: 'seed-structured',
      updatedAt: now,
    })
    console.log(`[created] ${name}/${ref.id} (order ${order})`)
    order += 1
  }
}

console.log('Done.')
process.exit(0)
