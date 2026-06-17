import { describe, it, expect } from 'vitest'
import { fmtError } from './action-error'

describe('fmtError', () => {
  it('returns the message of an Error', () => {
    expect(fmtError(new Error('boom'))).toBe('boom')
  })

  it('returns a fallback for non-Error values', () => {
    expect(fmtError('nope')).toBe('Unknown error')
    expect(fmtError(undefined)).toBe('Unknown error')
    expect(fmtError({ message: 'not an Error instance' })).toBe('Unknown error')
  })
})
