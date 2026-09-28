import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// MCA-91: /about shows only real, published content. Board and partner
// sections render only when something is published, and the hardcoded
// placeholder building cards are gone.

const data = vi.hoisted(() => ({
  board: [] as { id: string; name: string; role: string; note: string }[],
  partners: [] as { id: string; name: string }[],
}))

vi.mock('@/lib/cms/pages', () => ({ getPublishedPage: async () => null }))
vi.mock('@/lib/cms/milestones', () => ({
  milestonesStore: { listPublished: async () => [{ id: 'm1', year: 1893, title: 'W.T. acquires the property', body: 'The farm.' }] },
}))
vi.mock('@/lib/cms/board', () => ({ boardStore: { listPublished: async () => data.board } }))
vi.mock('@/lib/cms/partners', () => ({ partnersStore: { listPublished: async () => data.partners } }))

import AboutPage from './page'

beforeEach(() => {
  data.board = []
  data.partners = []
})

describe('/about', () => {
  it('omits the board and partner sections when nothing is published', async () => {
    render(await AboutPage())
    expect(screen.getByText('W.T. acquires the property')).toBeInTheDocument()
    expect(screen.queryByText('The board')).not.toBeInTheDocument()
    expect(screen.queryByText('In partnership with')).not.toBeInTheDocument()
  })

  it('shows published board members and partners', async () => {
    data.board = [{ id: 'b1', name: 'A. Person', role: 'President', note: '' }]
    data.partners = [{ id: 'p1', name: 'A Real Partner' }, { id: 'p2', name: 'Another' }]
    render(await AboutPage())
    expect(screen.getByText('The board')).toBeInTheDocument()
    expect(screen.getByText('A. Person')).toBeInTheDocument()
    expect(screen.getByText('In partnership with')).toBeInTheDocument()
    expect(screen.getByText(/A Real Partner/)).toBeInTheDocument()
  })

  it('no longer renders the placeholder copy', async () => {
    data.board = [{ id: 'b1', name: 'A. Person', role: 'President', note: '' }]
    const { container } = render(await AboutPage())
    for (const text of ['What still stands', 'The mule barn', 'The single-room school', 'Six neighbors']) {
      expect(container.textContent).not.toContain(text)
    }
  })
})
