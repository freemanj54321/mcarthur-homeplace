import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from './sanitize'

// Smoke coverage for the sanitizer harness. Exhaustive XSS-vector coverage
// lives in WS3 (MCA-21); these assert the test setup runs DOMPurify correctly.
describe('sanitizeHtml', () => {
  it('keeps allowlisted formatting tags', () => {
    const html = '<p>Hello <strong>world</strong></p>'
    expect(sanitizeHtml(html)).toBe(html)
  })

  it('strips <script> tags', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>')
  })

  it('strips disallowed event-handler attributes', () => {
    const out = sanitizeHtml('<p onclick="steal()">x</p>')
    expect(out).not.toContain('onclick')
  })

  it('drops javascript: URIs on links', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })
})
