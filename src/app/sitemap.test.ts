import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'

const listPublished = vi.fn()
const listPublishedSlugs = vi.fn()
vi.mock('@/lib/cms/projects', () => ({ projectsStore: { listPublished: () => listPublished() } }))
vi.mock('@/lib/cms/pages', () => ({ listPublishedSlugs: () => listPublishedSlugs() }))

import sitemap from './sitemap'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'mcarthur-web-prod')
  listPublished.mockResolvedValue([{ slug: 'main-house' }])
  listPublishedSlugs.mockResolvedValue(['about', 'stories'])
})
afterEach(() => vi.unstubAllEnvs())

const urls = async () => (await sitemap()).map((e) => e.url)

describe('sitemap.xml (MCA-130)', () => {
  it('lists static routes, published places and CMS pages on the site origin, without duplicates', async () => {
    expect((await urls()).sort()).toEqual([
      'https://wtmcarthurhomeplace.org',
      'https://wtmcarthurhomeplace.org/about',
      'https://wtmcarthurhomeplace.org/stories',
      'https://wtmcarthurhomeplace.org/visit',
      'https://wtmcarthurhomeplace.org/what-to-see',
      'https://wtmcarthurhomeplace.org/what-to-see/main-house',
    ])
  })

  it('includes /donate only where donations are enabled', async () => {
    expect(await urls()).not.toContain('https://wtmcarthurhomeplace.org/donate')
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'true')
    expect(await urls()).toContain('https://wtmcarthurhomeplace.org/donate')
  })

  it('still returns the static routes when page slugs fail to load (logged)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    listPublishedSlugs.mockRejectedValue(new Error('offline'))
    expect(await urls()).toContain('https://wtmcarthurhomeplace.org/visit')
    expect(JSON.parse(warn.mock.calls[0][0] as string)).toMatchObject({ scope: 'sitemap.pageSlugs' })
    warn.mockRestore()
  })
})
