import { describe, it, expect } from 'vitest'
import { COLLECTIONS, COLLECTION_KEYS, emptyValues } from './structuredFields'

describe('COLLECTIONS metadata', () => {
  it('COLLECTION_KEYS matches the COLLECTIONS keys', () => {
    expect(COLLECTION_KEYS).toEqual(Object.keys(COLLECTIONS))
  })

  it('every collection has a titleField present in its fields', () => {
    for (const meta of Object.values(COLLECTIONS)) {
      const names = meta.fields.map((f) => f.name)
      expect(names).toContain(meta.titleField)
    }
  })
})

describe('emptyValues', () => {
  it('initialises each field kind to its empty value', () => {
    const out = emptyValues(COLLECTIONS.projects)
    expect(out.title).toBe('') // text
    expect(out.cardImage).toBeNull() // image
    expect(out.heroImages).toEqual([]) // imageList
    expect(out.features).toEqual([]) // featureList
  })

  it('produces a key for every field', () => {
    const meta = COLLECTIONS.news
    expect(Object.keys(emptyValues(meta)).sort()).toEqual(meta.fields.map((f) => f.name).sort())
  })
})
