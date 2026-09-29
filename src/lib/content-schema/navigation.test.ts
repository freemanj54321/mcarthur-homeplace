import { describe, it, expect } from 'vitest'
import { NavLink, NavItem, PrimaryNavInput, FooterNavInput } from './navigation'

const link = { id: 'l1', label: 'About', href: '/about', kind: 'internal' as const }

describe('NavLink', () => {
  it('accepts internal and external links', () => {
    expect(NavLink.safeParse(link).success).toBe(true)
    expect(NavLink.safeParse({ ...link, href: 'https://example.org', kind: 'external' }).success).toBe(true)
  })

  it('rejects an empty label or href, an over-long label, and unknown kinds', () => {
    expect(NavLink.safeParse({ ...link, label: '' }).success).toBe(false)
    expect(NavLink.safeParse({ ...link, href: '' }).success).toBe(false)
    expect(NavLink.safeParse({ ...link, label: 'x'.repeat(81) }).success).toBe(false)
    expect(NavLink.safeParse({ ...link, kind: 'mailto' }).success).toBe(false)
  })
})

describe('NavItem', () => {
  it("allows fixed children and the 'projects' dynamic marker only", () => {
    expect(NavItem.safeParse({ ...link, children: [link], dynamicChildren: 'projects' }).success).toBe(true)
    expect(NavItem.safeParse({ ...link, dynamicChildren: 'news' }).success).toBe(false)
  })
})

describe('PrimaryNavInput / FooterNavInput', () => {
  it('accepts an empty but complete nav', () => {
    expect(PrimaryNavInput.safeParse({ utility: [], left: [], right: [] }).success).toBe(true)
    expect(FooterNavInput.safeParse({ tagline: '', columns: [], bottomLinks: [] }).success).toBe(true)
  })

  it('rejects a missing section, a headingless column and an over-long tagline', () => {
    expect(PrimaryNavInput.safeParse({ utility: [], left: [] }).success).toBe(false)
    expect(
      FooterNavInput.safeParse({ tagline: '', columns: [{ id: 'c', heading: '', links: [] }], bottomLinks: [] }).success,
    ).toBe(false)
    expect(FooterNavInput.safeParse({ tagline: 'x'.repeat(281), columns: [], bottomLinks: [] }).success).toBe(false)
  })
})
