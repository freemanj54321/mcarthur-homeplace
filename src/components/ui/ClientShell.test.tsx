import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientShell } from './ClientShell'

// MCA-91: the temporary design switcher only appears where the design-tools
// flag is on (dev/uat), never on the public prod site.

afterEach(() => vi.unstubAllEnvs())

const shell = () => render(<ClientShell header={<header>H</header>} footer={<footer>F</footer>}><main>Body</main></ClientShell>)

describe('ClientShell', () => {
  it('renders header, page and footer without design tools by default', () => {
    vi.stubEnv('NEXT_PUBLIC_DESIGN_TOOLS_ENABLED', undefined)
    shell()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /design options/i })).not.toBeInTheDocument()
  })

  it('hides the design tools when the flag is "false" (prod)', () => {
    vi.stubEnv('NEXT_PUBLIC_DESIGN_TOOLS_ENABLED', 'false')
    shell()
    expect(screen.queryByRole('button', { name: /design options/i })).not.toBeInTheDocument()
  })

  it('shows the design tools when the flag is "true" (dev/uat)', () => {
    vi.stubEnv('NEXT_PUBLIC_DESIGN_TOOLS_ENABLED', 'true')
    shell()
    expect(screen.getByRole('button', { name: /design options/i })).toBeInTheDocument()
  })
})
