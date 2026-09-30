import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationPage from './page'

// Domain-verification page for Google for Nonprofits: must state the legal
// name, EIN and that wtmcarthurhomeplace.org is the official domain.

describe('/organization', () => {
  it('states the legal name, EIN and official domain', () => {
    const { container } = render(<OrganizationPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'W. T. McArthur Historic Homeplace, Inc.' })).toBeInTheDocument()
    expect(container.textContent).toContain('93-4477897')
    expect(container.textContent).toMatch(/wtmcarthurhomeplace\.org is the official and primary domain/)
    expect(screen.getByRole('link', { name: 'https://wtmcarthurhomeplace.org' })).toHaveAttribute('href', 'https://wtmcarthurhomeplace.org')
  })
})
