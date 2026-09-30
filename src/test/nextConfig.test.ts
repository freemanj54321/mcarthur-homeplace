import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config'

// MCA-130: www must redirect permanently to the apex (one canonical host).
describe('next.config redirects', () => {
  it('sends every www path to the apex, permanently', async () => {
    const redirects = await nextConfig.redirects!()
    expect(redirects).toContainEqual({
      source: '/:path*',
      has: [{ type: 'host', value: 'www.wtmcarthurhomeplace.org' }],
      destination: 'https://wtmcarthurhomeplace.org/:path*',
      permanent: true,
    })
  })
})
