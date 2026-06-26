import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FooterNavInput, PrimaryNavInput } from '@/lib/cms/navigation'
import { NavigationEditor } from './NavigationEditor'

// The editor pulls in server actions (which import server-only firebase-admin)
// and the Next router. Stub both so the component renders under jsdom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))
vi.mock('./actions', () => ({
  savePrimaryNavAction: vi.fn(async () => ({ ok: true })),
  saveFooterNavAction: vi.fn(async () => ({ ok: true })),
}))

const primary: PrimaryNavInput = {
  utility: [],
  left: [
    { id: 'l1', label: 'About', href: '/about', kind: 'internal' },
    { id: 'l2', label: 'Visit', href: '/visit', kind: 'internal' },
  ],
  right: [],
}

const footer: FooterNavInput = {
  tagline: 'A homeplace tagline',
  columns: [
    {
      id: 'c1',
      heading: 'Explore',
      links: [{ id: 'fl1', label: 'Home', href: '/', kind: 'internal' }],
    },
  ],
  bottomLinks: [],
}

/** Label-input values in DOM order — the visible ordering of nav links. */
function labelValues() {
  return screen
    .getAllByPlaceholderText('Label')
    .map((el) => (el as HTMLInputElement).value)
}

function renderEditor() {
  return render(<NavigationEditor primary={primary} footer={footer} />)
}

describe('NavigationEditor', () => {
  it('renders the seeded nav items and footer link', () => {
    renderEditor()
    expect(labelValues()).toEqual(['About', 'Visit', 'Home'])
  })

  it('adds a new item to the left nav', async () => {
    const user = userEvent.setup()
    renderEditor()
    // Two "+ Add item" buttons (left list, right list); the first is the left.
    await user.click(screen.getAllByRole('button', { name: /add item/i })[0])
    expect(labelValues()).toEqual(['About', 'Visit', 'New link', 'Home'])
  })

  it('removes an item from the left nav', async () => {
    const user = userEvent.setup()
    renderEditor()
    // Remove buttons in DOM order: About, Visit, Home → remove the first.
    await user.click(screen.getAllByRole('button', { name: '✕' })[0])
    expect(labelValues()).toEqual(['Visit', 'Home'])
  })

  it('reorders the left nav items via the down control', async () => {
    const user = userEvent.setup()
    renderEditor()
    // First ↓ belongs to "About"; moving it down swaps it past "Visit".
    await user.click(screen.getAllByRole('button', { name: '↓' })[0])
    expect(labelValues()).toEqual(['Visit', 'About', 'Home'])
  })

  it('disables the up control on the first item', () => {
    renderEditor()
    expect(screen.getAllByRole('button', { name: '↑' })[0]).toBeDisabled()
  })

  it('edits a link label', async () => {
    const user = userEvent.setup()
    renderEditor()
    const aboutInput = screen.getByDisplayValue('About')
    await user.clear(aboutInput)
    await user.type(aboutInput, 'Our Story')
    expect(screen.getByDisplayValue('Our Story')).toBeInTheDocument()
  })
})
