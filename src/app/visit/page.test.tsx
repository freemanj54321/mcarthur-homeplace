import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// MCA-71: the /visit "Support the work" button follows the donations flag.

vi.mock('@/lib/cms/events', () => ({ eventsStore: { listPublished: async () => [] } }))

import VisitPage from './page'

afterEach(() => vi.unstubAllEnvs())

describe('/visit', () => {
  it('links to /donate when donations are on', async () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'true')
    render(await VisitPage())
    expect(screen.getByRole('link', { name: /support the work/i })).toHaveAttribute('href', '/donate')
  })

  it('drops the donate button when donations are off', async () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'false')
    render(await VisitPage())
    expect(screen.queryByRole('link', { name: /support the work/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveClass('btn-primary')
  })
})
