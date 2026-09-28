import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// MCA-71: the /visit "Support the work" button follows the donations flag.

const events = vi.hoisted(() => ({ list: [] as Record<string, unknown>[] }))
vi.mock('@/lib/cms/events', () => ({ eventsStore: { listPublished: async () => events.list } }))

import VisitPage from './page'

afterEach(() => {
  vi.unstubAllEnvs()
  events.list = []
})

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

  it('makes no open-days claim (MCA-91: none are scheduled)', async () => {
    const { container } = render(await VisitPage())
    expect(container.textContent).not.toMatch(/open days|porch is open/i)
  })

  it('asks visitors to check back when no dates are published', async () => {
    render(await VisitPage())
    expect(screen.getByText(/check back here for future dates/i)).toBeInTheDocument()
  })

  it('lists published dates instead of the check-back note', async () => {
    events.list = [{ id: 'e1', title: 'Open Day', date: '2026-11-07', location: 'Main House', time: '10am', excerpt: '' }]
    render(await VisitPage())
    expect(screen.getByText('Open Day')).toBeInTheDocument()
    expect(screen.queryByText(/check back here/i)).not.toBeInTheDocument()
  })
})
