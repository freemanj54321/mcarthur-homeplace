/**
 * Seed the `pages` Firestore collection with initial content for the
 * Stories and About pages.
 *
 * Usage:
 *   node scripts/seed-pages.mjs
 *
 * Reads credentials from $FIREBASE_SERVICE_ACCOUNT_JSON (JSON string) or
 * $SA_PATH (path to a service-account JSON file).
 *
 * Idempotent: skips any page whose slug already exists in Firestore.
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

// ── Page definitions ──────────────────────────────────────────────────────────

const PAGES = [
  {
    slug: 'stories',
    title: 'Stories & News',
    sections: [
      {
        id: 'stories-intro',
        type: 'richText',
        html: '<p class="lead">Stories, field notes, and oral history transcripts are on their way. We are gathering them now — seventeen interviews recorded, three ready to share this spring.</p>',
      },
    ],
  },
  {
    slug: 'about',
    title: 'Our Story',
    sections: [
      {
        id: 'about-intro',
        type: 'richText',
        html: '<p class="lead dropcap">William Thomas McArthur acquired one hundred and sixty acres on the south fork in 1893. A small four-square cottage stood on the land; he and his wife would build the central-hall house around it by 1900, leaving the original rooms as the kitchen, pantry, and dining room. Long-leaf pine, cut on the property, hauled by mule, milled in town. Three generations of his family lived in that house. Two more were born nearby. The land grew tobacco, then cattle, then nothing — and the buildings began their long quiet. We are descendants and neighbors. We are bringing them back.</p>',
      },
      {
        id: 'about-why-it-matters',
        type: 'twoColumn',
        leftHtml:
          '<p>The Historic Homeplace is unusual not for any single building but for an absence of interruption. The McArthur family has owned the property since 1893. That continuity is the reason the home and outbuildings are still standing — and the reason the verbal and written history of the families who lived and worked here, McArthur and otherwise, has not been lost.</p>',
        rightHtml:
          '<p>It is also the reason the old-growth long-leaf pines on the property — roughly twenty of them, adjacent to the home — are still standing. They are estimated to be among a very small number of survivors of the millions of acres of long-leaf forest that covered the South when Europeans first arrived.</p>',
      },
      {
        id: 'about-farm-worked',
        type: 'twoColumn',
        leftHtml:
          '<h3>The everyday</h3><p>Much of what was routine on a southern farm in the late nineteenth and early twentieth century is now beyond the imagination of most adults. Sugar cane was ground and its juice boiled down to syrup. Hogs and other livestock were butchered on the property. Mules — not tractors — pulled wagons and farm implements. Some mechanization had arrived by the early 1900s, but most field work was still done behind a mule.</p>',
        rightHtml:
          '<h3>The tenant system</h3><p>With mule-drawn implements, one person could only work between twenty and forty acres. Large farms relied on tenant families — one roughly built house per thirty to forty acres, each family tending its parcel, keeping a garden and a few animals for their own use. Once a year, after the harvest sold, the husband received a share of the profit.</p><p>To bridge the months between, the farm operated a commissary — a store that sold essentials on credit. The balance was deducted from the year-end pay. In practice, the arrangement looked a great deal like indentured servitude. The W.T. McArthur commissary still stands, and multiple account books survive — every transaction recorded by name.</p>',
      },
      {
        id: 'about-pine-rosin',
        type: 'richText',
        html: '<p>Mules also worked the pine forests. Farm hands tapped the long-leaf pines for rosin, hauled it in mule-drawn wagons, and refined it in a still on the property — turpentine for trade, and pitch for the naval stores industry that once waterproofed wooden ships. Stills were dangerous; the heat came from wood fires and everything in reach was flammable. The McArthur still and its building burned to the ground. Nothing of either remains except the stories of the people who worked the pines.</p>',
      },
      {
        id: 'about-pull-quote',
        type: 'quote',
        html: '<p>“The smell of the kitchen never left it. Forty years empty and you could still tell where my grandmother stood.”</p>',
        attribution: 'Ruby McArthur Pearce, 2025',
      },
    ],
  },
]

// ── Seed ─────────────────────────────────────────────────────────────────────

for (const { slug, title, sections } of PAGES) {
  const existing = await db.collection('pages').where('slug', '==', slug).limit(1).get()
  if (!existing.empty) {
    console.log(`[skip]    ${slug} — document already exists (id: ${existing.docs[0].id})`)
    continue
  }

  const now = FieldValue.serverTimestamp()
  const publishedSnapshot = { title, hero: null, sections }

  const ref = await db.collection('pages').add({
    slug,
    title,
    hero: null,
    sections,
    status: 'published',
    publishedSnapshot,
    publishedAt: now,
    createdBy: 'seed-pages',
    createdAt: now,
    updatedBy: 'seed-pages',
    updatedAt: now,
  })

  console.log(`[created] ${slug} → pages/${ref.id}`)
}

console.log('Done.')
process.exit(0)
