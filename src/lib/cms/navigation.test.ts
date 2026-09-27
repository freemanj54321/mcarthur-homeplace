import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/lib/firebase-admin', () => import('@/test/firebaseAdminMock'))

import { getPrimaryNav, getPrimaryNavRaw, getFooterNav, getFooterNavRaw } from '@/lib/cms/navigation'
import { resetFirebaseAdminMock, getMockDb } from '@/test/firebaseAdminMock'

// MCA-71: nav filtering of /donate links by the donations feature flag. The
// public resolvers filter; the *Raw readers the admin editor uses never do.

const link = (id: string, href: string) => ({ id, label: id, href, kind: 'internal' as const })

const savedPrimary = {
  utility: [link('visit', '/visit'), link('donate', '/donate')],
  left: [
    { ...link('about', '/about'), children: [link('story', '/about/story'), link('give', '/donate?fund=match')] },
    link('left-donate', '/donate/monthly'),
  ],
  right: [link('stories', '/stories')],
}

const savedFooter = {
  tagline: 'tagline',
  columns: [{ id: 'col', heading: 'Get Involved', links: [link('foot-donate', '/donate'), link('vol', '/volunteer')] }],
  bottomLinks: [link('privacy', '/privacy'), link('bottom-donate', '/donate#give')],
}

const hrefs = (links: { href: string }[]) => links.map((l) => l.href)

beforeEach(() => {
  resetFirebaseAdminMock()
  getMockDb().seed('navigation', 'primary', savedPrimary)
  getMockDb().seed('navigation', 'footer', savedFooter)
})
afterEach(() => vi.unstubAllEnvs())

describe('donations off (prod)', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'false'))

  it('drops /donate links from the primary nav, including dropdown children', async () => {
    const nav = await getPrimaryNav()
    expect(hrefs(nav.utility)).toEqual(['/visit'])
    expect(hrefs(nav.left)).toEqual(['/about'])
    expect(hrefs(nav.left[0].children ?? [])).toEqual(['/about/story'])
    expect(hrefs(nav.right)).toEqual(['/stories'])
  })

  it('drops /donate links from footer columns and bottom links', async () => {
    const footer = await getFooterNav()
    expect(hrefs(footer.columns[0].links)).toEqual(['/volunteer'])
    expect(hrefs(footer.bottomLinks)).toEqual(['/privacy'])
    expect(footer.tagline).toBe('tagline')
  })

  it('filters the hardcoded defaults when Firestore has no nav', async () => {
    resetFirebaseAdminMock()
    const [nav, footer] = await Promise.all([getPrimaryNav(), getFooterNav()])
    const all = [...nav.utility, ...nav.left, ...nav.right, ...footer.columns.flatMap((c) => c.links), ...footer.bottomLinks]
    expect(all.some((l) => l.href === '/donate')).toBe(false)
    expect(hrefs(nav.utility)).toEqual(['/visit'])
  })

  it('leaves the admin editor view unfiltered so saving never erases links', async () => {
    expect(await getPrimaryNavRaw()).toEqual(savedPrimary)
    expect(await getFooterNavRaw()).toEqual(savedFooter)
  })
})

describe('donations on (dev/uat)', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'true'))

  it('keeps every /donate link', async () => {
    const [nav, footer] = await Promise.all([getPrimaryNav(), getFooterNav()])
    expect(hrefs(nav.utility)).toEqual(['/visit', '/donate'])
    expect(hrefs(nav.left)).toEqual(['/about', '/donate/monthly'])
    expect(hrefs(nav.left[0].children ?? [])).toEqual(['/about/story', '/donate?fund=match'])
    expect(hrefs(footer.columns[0].links)).toEqual(['/donate', '/volunteer'])
    expect(hrefs(footer.bottomLinks)).toEqual(['/privacy', '/donate#give'])
  })
})
