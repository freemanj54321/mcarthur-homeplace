import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-41 — DONE. Guard for `firestore.indexes.json`, which JSON can't self-document.
//
// WHY this test exists: a missing composite index fails *silently* here. Both
// photo queries wrap their `get()` in `try { … } catch { return [] }`
// (src/lib/photos.ts, src/lib/cms/photosAdmin.ts), so an un-indexed query
// returns an empty list rather than throwing — galleries render blank and a
// "page loaded without error" smoke test still passes. Deleting an index would
// therefore be invisible in CI and in prod. This test makes it loud.
//
// Keep in sync: every equality-filter + orderBy-on-another-field query needs an
// entry here AND in firestore.indexes.json.

const indexesPath = fileURLToPath(new URL('../../firestore.indexes.json', import.meta.url))

type IndexField = { fieldPath: string; order?: string; arrayConfig?: string }
type CompositeIndex = {
  collectionGroup: string
  queryScope: string
  fields: IndexField[]
}
type IndexConfig = { indexes: CompositeIndex[]; fieldOverrides?: unknown[] }

const config: IndexConfig = JSON.parse(readFileSync(indexesPath, 'utf8'))

/** Composite indexes Firestore *requires*, each tied to the query that needs it. */
const REQUIRED = [
  {
    why: "photos.ts getProjectPhotos / photosAdmin.ts listPhotosByProject — where('project','==') + orderBy('order')",
    collectionGroup: 'photos',
    fields: [
      { fieldPath: 'project', order: 'ASCENDING' },
      { fieldPath: 'order', order: 'ASCENDING' },
    ],
  },
  {
    why: "photos.ts getFeaturedPhotos / photosAdmin.ts listFeaturedPhotos — where('featured','==') + orderBy('order')",
    collectionGroup: 'photos',
    fields: [
      { fieldPath: 'featured', order: 'ASCENDING' },
      { fieldPath: 'order', order: 'ASCENDING' },
    ],
  },
]

const signature = (i: { collectionGroup: string; fields: IndexField[] }) =>
  `${i.collectionGroup}:${i.fields.map((f) => `${f.fieldPath}/${f.order ?? f.arrayConfig}`).join(',')}`

describe('firestore.indexes.json', () => {
  it('is valid JSON with an indexes array', () => {
    expect(Array.isArray(config.indexes)).toBe(true)
  })

  it.each(REQUIRED)('declares the composite index for $why', (required) => {
    const present = config.indexes.map(signature)
    expect(present).toContain(signature(required))
  })

  it('scopes every index to COLLECTION and gives each field a direction', () => {
    for (const index of config.indexes) {
      expect(index.queryScope).toBe('COLLECTION')
      expect(index.fields.length).toBeGreaterThan(1) // single-field indexes are automatic
      for (const field of index.fields) {
        expect(field.order ?? field.arrayConfig).toBeDefined()
      }
    }
  })

  it('has no duplicate index definitions', () => {
    const sigs = config.indexes.map(signature)
    expect(new Set(sigs).size).toBe(sigs.length)
  })
})
