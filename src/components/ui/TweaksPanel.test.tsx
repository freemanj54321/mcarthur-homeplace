import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { TweaksProvider } from '@/context/TweaksContext'
import { TweaksPanel } from './TweaksPanel'

// MCA-71: the "Donate CTA" control only appears where donations are on.
// TODO(MCA-24): delete with the TweaksPanel once the design is locked.

afterEach(() => vi.unstubAllEnvs())

function renderOpenPanel() {
  render(
    <TweaksProvider>
      <TweaksPanel />
    </TweaksProvider>,
  )
  // The panel opens on the host's edit-mode message.
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data: { type: '__activate_edit_mode' } }))
  })
}

describe('TweaksPanel donate control', () => {
  it('offers the Donate CTA style when donations are on', () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'true')
    renderOpenPanel()
    expect(screen.getByText('Donate CTA')).toBeInTheDocument()
  })

  it('hides it when donations are off', () => {
    vi.stubEnv('NEXT_PUBLIC_DONATIONS_ENABLED', 'false')
    renderOpenPanel()
    expect(screen.queryByText('Donate CTA')).not.toBeInTheDocument()
    // The panel is open; only the donate section is gone.
    expect(screen.getByText('Project card layout')).toBeInTheDocument()
  })
})
