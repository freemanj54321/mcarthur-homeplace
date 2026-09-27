import { describe, it, expect, afterEach, vi } from 'vitest'

// MCA-71: /donate is a 404 wherever the donations flag is off.

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))

const listPublished = vi.fn(async () => [{ slug: 'main-house', title: 'The Main House' }])
vi.mock('@/lib/cms/projects', () => ({ projectsStore: { listPublished: () => listPublished() } }))

import DonatePage from './page'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('/donate', () => {
  it('404s without reading content when donations are off', async () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'false')
    await expect(DonatePage()).rejects.toThrow('NEXT_NOT_FOUND')
    expect(listPublished).not.toHaveBeenCalled()
  })

  it('renders the form with published projects when donations are on', async () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'true')
    const page = await DonatePage()
    expect(notFound).not.toHaveBeenCalled()
    expect(page.props.projects).toEqual([{ slug: 'main-house', title: 'The Main House' }])
  })
})
