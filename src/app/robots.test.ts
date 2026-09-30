import { describe, it, expect, afterEach, vi } from 'vitest'
import robots from './robots'

afterEach(() => vi.unstubAllEnvs())

describe('robots.txt (MCA-130)', () => {
  it('prod: indexable except admin/api, and points at the sitemap', () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'mcarthur-web-prod')
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
      sitemap: 'https://wtmcarthurhomeplace.org/sitemap.xml',
    })
  })

  it.each(['mcarthur-web-dev', 'mcarthur-web-uat', 'mcarthur-tour'])('%s: blocks all crawling', (project) => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', project)
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } })
  })
})
