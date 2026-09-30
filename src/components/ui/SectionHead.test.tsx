import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SectionHead } from './SectionHead'

describe('SectionHead', () => {
  it('renders allowlisted inline HTML in the title (em tag)', () => {
    const { container } = render(<SectionHead title="Hello <em>world</em>" />)
    const h2 = container.querySelector('h2')
    expect(h2?.innerHTML).toBe('Hello <em>world</em>')
  })

  it('strips script tags from the title (XSS)', () => {
    const { container } = render(
      <SectionHead title='Safe<script>alert("xss")</script>' />,
    )
    const h2 = container.querySelector('h2')
    expect(h2?.innerHTML).not.toContain('<script>')
    expect(h2?.innerHTML).toContain('Safe')
  })

  it('strips event-handler attributes from the title', () => {
    const { container } = render(
      <SectionHead title='<em onclick="steal()">text</em>' />,
    )
    const h2 = container.querySelector('h2')
    expect(h2?.innerHTML).not.toContain('onclick')
    expect(h2?.innerHTML).toContain('text')
  })

  it('renders eyebrow and lede as plain text (not HTML)', () => {
    const { getByText } = render(
      <SectionHead eyebrow="Our story" title="Title" lede="Some lead text" />,
    )
    expect(getByText('Our story')).toBeTruthy()
    expect(getByText('Some lead text')).toBeTruthy()
  })
})
