import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from './not-found'

describe('not-found page (MCA-130)', () => {
  it('explains the page is missing and offers a way back', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/leads nowhere/)
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })
})
