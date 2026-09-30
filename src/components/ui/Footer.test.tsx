import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

// MCA-91: the placeholder "Letters from the Porch" newsletter form (which sent
// nothing) is gone; the footer renders the CMS columns and bottom links only.

const data = {
  tagline: 'A homeplace, restored.',
  columns: [{ id: 'c1', heading: 'Visit', links: [{ id: 'l1', label: 'Plan a Visit', href: '/visit', kind: 'internal' as const }] }],
  bottomLinks: [{ id: 'b1', label: 'Facebook', href: 'https://facebook.com/x', kind: 'external' as const }],
}

describe('Footer', () => {
  it('renders the CMS tagline, columns and links', () => {
    render(<Footer data={data} />)
    expect(screen.getByText('A homeplace, restored.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Visit' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plan a Visit' })).toHaveAttribute('href', '/visit')
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute('target', '_blank')
  })

  it('has no newsletter sign-up', () => {
    render(<Footer data={data} />)
    expect(screen.queryByText(/Letters from the Porch/)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /email/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument()
  })
})
