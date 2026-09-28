import { describe, it, expect, afterEach, vi } from 'vitest'
import { designToolsEnabled, donationsEnabled, isDonateHref } from '@/lib/features'

afterEach(() => vi.unstubAllEnvs())

describe('donationsEnabled', () => {
  it('is on only for the exact string "true"', () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'true')
    expect(donationsEnabled()).toBe(true)
  })

  it.each(['false', 'TRUE', '1', 'yes', ' true', ''])('fails closed for %j', (value) => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', value)
    expect(donationsEnabled()).toBe(false)
  })

  it('fails closed when unset (legacy backend, local builds)', () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', undefined)
    expect(donationsEnabled()).toBe(false)
  })
})

describe('designToolsEnabled (MCA-91)', () => {
  it('is on only for the exact string "true"', () => {
    vi.stubEnv('NEXT_PUBLIC_DESIGN_TOOLS_ENABLED', 'true')
    expect(designToolsEnabled()).toBe(true)
  })

  it.each(['false', 'TRUE', '1', ''])('fails closed for %j', (value) => {
    vi.stubEnv('NEXT_PUBLIC_DESIGN_TOOLS_ENABLED', value)
    expect(designToolsEnabled()).toBe(false)
  })

  it('fails closed when unset', () => {
    vi.stubEnv('NEXT_PUBLIC_DESIGN_TOOLS_ENABLED', undefined)
    expect(designToolsEnabled()).toBe(false)
  })
})

describe('isDonateHref', () => {
  it.each(['/donate', '/donate/', '/donate/monthly', '/donate?amount=50', '/donate#give'])('matches %s', (href) => {
    expect(isDonateHref(href)).toBe(true)
  })

  it.each(['/', '/donations', '/donater', '/about/donate', 'https://example.org/donate', '/visit'])(
    'ignores %s',
    (href) => {
      expect(isDonateHref(href)).toBe(false)
    },
  )
})
