import { describe, it, expect } from 'vitest'
import { fmtError } from './action-error'

describe('fmtError', () => {
  it('returns the message of an Error', () => {
    expect(fmtError(new Error('boom'))).toBe('boom')
  })

  it('keeps a Firebase-style error code (MCA-32)', () => {
    const err = Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' })
    expect(fmtError(err)).toBe('Missing or insufficient permissions. [permission-denied]')
  })

  it('reads error-like objects that are not Error instances', () => {
    expect(fmtError({ message: 'not an Error instance' })).toBe('not an Error instance')
    expect(fmtError({ code: 9, details: 'The query requires an index.' })).toBe('The query requires an index. [9]')
  })

  it('returns strings as-is and a fallback for anything else', () => {
    expect(fmtError('nope')).toBe('nope')
    expect(fmtError(undefined)).toBe('Unknown error')
    expect(fmtError(42)).toBe('Unknown error')
  })
})
