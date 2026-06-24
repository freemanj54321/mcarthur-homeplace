import { describe, it, expect } from 'vitest'
import { ContentImage, slugSchema } from './media'

describe('ContentImage', () => {
  it('accepts an absolute https URL', () => {
    expect(
      ContentImage.safeParse({ storagePath: 'p', downloadUrl: 'https://x/y.jpg', alt: 'a' }).success,
    ).toBe(true)
  })

  it('accepts a same-origin absolute path', () => {
    expect(
      ContentImage.safeParse({ storagePath: 'p', downloadUrl: '/images/y.jpg', alt: '' }).success,
    ).toBe(true)
  })

  it('rejects a downloadUrl that is neither a URL nor an absolute path', () => {
    expect(
      ContentImage.safeParse({ storagePath: 'p', downloadUrl: 'images/y.jpg', alt: '' }).success,
    ).toBe(false)
  })
})

describe('slugSchema', () => {
  it('accepts a lowercase hyphenated slug', () => {
    expect(slugSchema.safeParse('main-house').success).toBe(true)
  })

  it.each(['Main-House', 'main house', '-main', 'main_house', ''])('rejects %j', (s) => {
    expect(slugSchema.safeParse(s).success).toBe(false)
  })
})
