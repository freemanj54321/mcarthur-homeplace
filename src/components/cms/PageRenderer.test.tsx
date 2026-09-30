import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { Section } from '@/lib/content-schema'
import { SectionsRenderer } from './PageRenderer'

// MCA-21: every section type that renders editor HTML must sanitize it at
// render time, not only on save, so older or imported docs can't inject script.
const XSS = '<p>ok</p><script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">x</a>'

const sections: Section[] = [
  { id: 'r', type: 'richText', html: XSS },
  { id: 't', type: 'twoColumn', leftHtml: XSS, rightHtml: XSS },
  { id: 'q', type: 'quote', html: XSS, attribution: 'Someone' },
  { id: 'c', type: 'callout', tone: 'info', html: XSS },
]

describe('SectionsRenderer (XSS)', () => {
  it('strips script tags, event handlers and javascript: URLs from every HTML section', () => {
    const { container } = render(<SectionsRenderer sections={sections} />)
    const html = container.innerHTML
    expect(container.querySelectorAll('script')).toHaveLength(0)
    expect(html).not.toMatch(/onerror/i)
    expect(html).not.toMatch(/javascript:/i)
    // The harmless content survives in each of the 5 HTML fields.
    expect(container.querySelectorAll('p').length).toBeGreaterThanOrEqual(5)
  })
})
