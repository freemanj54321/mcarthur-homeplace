import { describe, it, expect } from 'vitest'
import { ProjectInput } from './projects'
import { NewsInput } from './news'
import { EventInput } from './events'
import { PartnerInput } from './partners'
import { PHOTO_CATEGORIES, PhotoInput } from './photos'

describe('ProjectInput', () => {
  const valid = {
    slug: 'main-house', title: 'Main House', subtitle: '', kind: '', built: '',
    architect: '', style: '', materials: '', footprint: '', placeholder: '',
    excerpt: '', description: '', features: [], cardImage: null, heroImages: [],
  }

  it('accepts a fully-populated valid project', () => {
    expect(ProjectInput.safeParse(valid).success).toBe(true)
  })

  it('rejects an empty title', () => {
    expect(ProjectInput.safeParse({ ...valid, title: '' }).success).toBe(false)
  })

  it('rejects an invalid slug', () => {
    expect(ProjectInput.safeParse({ ...valid, slug: 'Main House' }).success).toBe(false)
  })
})

describe('EventInput', () => {
  const base = { title: 'Open Day', date: '', time: '', location: '', excerpt: '' }

  it('requires a non-empty title', () => {
    expect(EventInput.safeParse({ ...base, title: '' }).success).toBe(false)
    expect(EventInput.safeParse(base).success).toBe(true)
  })
})

describe('NewsInput', () => {
  const valid = {
    slug: 'a-story', title: 'A Story', date: '', category: '',
    placeholder: '', excerpt: '', content: '', image: null,
  }

  it('accepts a valid story', () => {
    expect(NewsInput.safeParse(valid).success).toBe(true)
  })

  it('rejects an invalid slug', () => {
    expect(NewsInput.safeParse({ ...valid, slug: 'Bad Slug' }).success).toBe(false)
  })
})

describe('PartnerInput.url (url-or-empty)', () => {
  it('treats url as optional', () => {
    expect(PartnerInput.safeParse({ name: 'P' }).success).toBe(true)
  })

  it('accepts an empty string', () => {
    expect(PartnerInput.safeParse({ name: 'P', url: '' }).success).toBe(true)
  })

  it('accepts a valid URL', () => {
    expect(PartnerInput.safeParse({ name: 'P', url: 'https://x.org' }).success).toBe(true)
  })

  it('rejects a non-empty non-URL string', () => {
    expect(PartnerInput.safeParse({ name: 'P', url: 'notaurl' }).success).toBe(false)
  })
})

describe('PhotoInput', () => {
  const valid = {
    filename: 'porch.jpg', storagePath: 'photos/porch.jpg',
    downloadUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/photos%2Fporch.jpg',
    caption: '', altText: '', project: null, category: 'archival',
    featured: false, order: -1, dateTaken: '',
  }

  it('accepts a valid, unassigned photo', () => {
    expect(PhotoInput.safeParse(valid).success).toBe(true)
  })

  it('accepts every declared category and nothing else', () => {
    for (const category of PHOTO_CATEGORIES) {
      expect(PhotoInput.safeParse({ ...valid, category }).success).toBe(true)
    }
    expect(PhotoInput.safeParse({ ...valid, category: 'selfie' }).success).toBe(false)
  })

  it('requires an absolute downloadUrl and a storagePath', () => {
    expect(PhotoInput.safeParse({ ...valid, downloadUrl: '/images/a.jpg' }).success).toBe(false)
    expect(PhotoInput.safeParse({ ...valid, storagePath: '' }).success).toBe(false)
  })

  it('caps caption and alt text at 400 characters', () => {
    expect(PhotoInput.safeParse({ ...valid, caption: 'x'.repeat(401) }).success).toBe(false)
    expect(PhotoInput.safeParse({ ...valid, altText: 'x'.repeat(400) }).success).toBe(true)
  })
})
