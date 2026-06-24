import { describe, it, expect } from 'vitest'
import { Section, PageDraftInput, SECTION_LABELS, newSection, type SectionType } from './sections'

const TYPES: SectionType[] = ['richText', 'image', 'twoColumn', 'quote', 'callout', 'gallery']

describe('newSection', () => {
  it.each(TYPES)('builds a section with the correct type and an id for %s', (type) => {
    const s = newSection(type)
    expect(s.type).toBe(type)
    expect(s.id).toBeTruthy()
  })

  it('produces schema-valid sections (a fresh image section needs a real downloadUrl)', () => {
    for (const type of TYPES) {
      const s = newSection(type)
      // newSection('image') is intentionally blank — downloadUrl is empty until
      // an image is chosen, so patch a valid URL before validating.
      const candidate = s.type === 'image' ? { ...s, downloadUrl: 'https://example.org/i.jpg' } : s
      expect(Section.safeParse(candidate).success).toBe(true)
    }
  })

  it('assigns a unique id per call', () => {
    expect(newSection('richText').id).not.toBe(newSection('richText').id)
  })
})

describe('SECTION_LABELS', () => {
  it('has a label for every section type', () => {
    for (const t of TYPES) expect(typeof SECTION_LABELS[t]).toBe('string')
  })
})

describe('PageDraftInput', () => {
  const valid = { slug: 'about/history', title: 'History', hero: null, sections: [] }

  it('accepts a valid draft (including "/"-segmented slugs)', () => {
    expect(PageDraftInput.safeParse(valid).success).toBe(true)
  })

  it('rejects a slug starting with "admin"', () => {
    expect(PageDraftInput.safeParse({ ...valid, slug: 'admin' }).success).toBe(false)
    expect(PageDraftInput.safeParse({ ...valid, slug: 'adminfoo' }).success).toBe(false)
  })

  it('rejects an uppercase slug', () => {
    expect(PageDraftInput.safeParse({ ...valid, slug: 'About' }).success).toBe(false)
  })

  it('rejects an empty title', () => {
    expect(PageDraftInput.safeParse({ ...valid, title: '' }).success).toBe(false)
  })
})
