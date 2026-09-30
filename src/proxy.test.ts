import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy, config } from './proxy'

const req = (path: string, session?: string) => {
  const r = new NextRequest(new URL(path, 'https://example.org'))
  if (session !== undefined) r.cookies.set('__session', session)
  return r
}

describe('proxy (admin login redirect)', () => {
  it('redirects signed-out visitors to login, remembering the path', () => {
    const res = proxy(req('/admin/navigation'))
    expect(res.status).toBe(307)
    const loc = new URL(res.headers.get('location')!)
    expect(loc.pathname + loc.search).toBe('/admin/login?next=%2Fadmin%2Fnavigation')
  })

  it('lets the login page through without a session (no redirect loop)', () => {
    expect(proxy(req('/admin/login')).headers.get('location')).toBeNull()
  })

  it('lets requests with a session cookie through (pages verify it)', () => {
    expect(proxy(req('/admin/pages', 'cookie-value')).headers.get('location')).toBeNull()
  })

  it('treats an empty session cookie as signed out', () => {
    expect(proxy(req('/admin', '')).status).toBe(307)
  })

  it('only runs on /admin routes', () => {
    expect(config.matcher).toEqual(['/admin/:path*'])
  })
})
