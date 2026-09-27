import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DonateStrip } from './DonateStrip'

// MCA-71: DonateStrip is the single gate for the match banner on home, about,
// and the What to See pages.

afterEach(() => vi.unstubAllEnvs())

describe('DonateStrip', () => {
  it.each(['quiet', 'banner', 'sticker'] as const)('links to /donate in %s style when donations are on', (style) => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'true')
    render(<DonateStrip style={style} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/donate')
  })

  it.each(['false', undefined])('renders nothing when the flag is %j (prod, legacy)', (value) => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', value)
    const { container } = render(<DonateStrip />)
    expect(container).toBeEmptyDOMElement()
  })
})
