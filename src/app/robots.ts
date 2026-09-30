import type { MetadataRoute } from 'next'
import { isProductionSite, resolveSiteUrl } from '@/lib/firebaseConfig'

// MCA-130: only prod is indexed. dev and uat carry sample content and must not
// compete with the real site in search results.
export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite(process.env)) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${resolveSiteUrl(process.env)}/sitemap.xml`,
  }
}
