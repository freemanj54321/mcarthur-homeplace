import { describe, it, expect, vi, afterEach } from 'vitest'
import { describeError, logFallback } from './log'

afterEach(() => vi.restoreAllMocks())

describe('describeError', () => {
  it('keeps the code of an Error when present', () => {
    expect(describeError(new Error('plain'))).toBe('plain')
    expect(describeError(Object.assign(new Error('failed'), { code: 'unavailable' }))).toBe('failed [unavailable]')
  })

  it('handles strings, message/details objects and unknowns', () => {
    expect(describeError('text')).toBe('text')
    expect(describeError({ details: 'index needed', code: 9 })).toBe('index needed [9]')
    expect(describeError({ message: 'm' })).toBe('m')
    expect(describeError(null)).toBe('Unknown error')
    expect(describeError({})).toBe('Unknown error')
  })
})

describe('logFallback', () => {
  it('writes one structured WARNING line Cloud Logging can parse', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logFallback('photos.listByProject', new Error('index missing'), { slug: 'main-house' })
    expect(warn).toHaveBeenCalledOnce()
    expect(JSON.parse(warn.mock.calls[0][0] as string)).toEqual({
      severity: 'WARNING',
      message: 'photos.listByProject failed; serving fallback',
      scope: 'photos.listByProject',
      error: 'index missing',
      slug: 'main-house',
    })
  })
})
