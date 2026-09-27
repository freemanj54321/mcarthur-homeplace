import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroTypographic } from './HeroTypographic'

// MCA-71: the hero's match copy and donate button follow the donations flag.

afterEach(() => vi.unstubAllEnvs())

describe('HeroTypographic', () => {
  it('shows the match copy and donate button when donations are on', () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'true')
    render(<HeroTypographic />)
    expect(screen.getByRole('link', { name: /donate to the match/i })).toHaveAttribute('href', '/donate')
    expect(screen.getByText(/matched by the State Historical Commission/)).toBeInTheDocument()
  })

  it('hides both when donations are off, keeping the other calls to action', () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'false')
    render(<HeroTypographic />)
    expect(screen.queryByRole('link', { name: /donate/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/matched by the State Historical Commission/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /what to see/i })).toBeInTheDocument()
  })
})
